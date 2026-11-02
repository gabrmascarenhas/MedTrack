# MedTrack

Projeto acadêmico da disciplina de Desenvolvimento Web para organizar informações e aproximar pacientes e profissionais de saúde antes, durante e depois da consulta.

A proposta é permitir que o paciente prepare suas dúvidas e sintomas antes do atendimento, que o médico tenha acesso a esse contexto e que as orientações e o acompanhamento fiquem disponíveis após a consulta.

O sistema está em desenvolvimento. Cadastro, autenticação, edição de perfil e administração básica já estão integrados ao MongoDB Atlas. As telas de consultas, agenda, preparação, resumos e pós-consulta estão conectadas às rotas do back-end. O fluxo completo ainda precisa de validação no ambiente de homologação.

> O MedTrack não realiza diagnósticos, não sugere tratamentos e não substitui a avaliação de um profissional de saúde.

## Estado atual

| Funcionalidade | Situação |
| --- | --- |
| Homepage pública e cadastro direcionado por perfil | Implementado |
| Cadastro de paciente e médico | Integrado à API e ao banco |
| Login, logout e sessão por cookie HTTP-only | Implementado |
| Confirmação de senha e mostrar/ocultar senha | Implementado na interface |
| Edição de nome, e-mail, nascimento e gênero | Integrado à API e ao banco |
| Especialidade, CRM e UF para médicos | Integrado à API e ao banco |
| Administrador: listar usuários e editar nome/e-mail | Implementado |
| Acesso administrativo às áreas de paciente e médico | Implementado |
| Consultas: criação, preparação, aceite, remarcação, cancelamento e exclusão | Rotas e telas integradas; validação completa pendente |
| Resumo do paciente, orientações e acompanhamento | Rotas e telas integradas; validação completa pendente |
| Calendário mensal na agenda médica, com consultas por dia e status | Implementado |
| Busca textual de consultas e pacientes | Implementada na interface |
| Filtros específicos de data/status e busca na administração | Pendente |
| Hospedagem na Vercel com MongoDB Atlas | Publicada; atualização vinculada à branch de produção |
| Testes com Postman e Playwright | Planejados; ainda sem coleção ou configuração no repositório |

As páginas **Minhas consultas** e **Agenda** carregam dados de `/api/bootstrap`. Os painéis iniciais mostram contadores, próximas consultas e solicitações pendentes. A interface atualiza os dados após as ações, ao retornar à janela e a cada 30 segundos enquanto a área clínica está ativa e a aba está visível.

Os componentes clínicos e o design da área interna foram recuperados de uma versão anterior do MedTrack e adaptados à autenticação, ao cadastro e à navegação atuais. A homepage pública foi preservada. Foram feitas conferências de interface com dados fictícios em memória; isso não substitui a validação ponta a ponta com o back-end e o Atlas.

A interface foi construída com layouts responsivos, mas a validação completa de usabilidade ainda está pendente.

## Perfis de acesso

- **Paciente (`patient`):** possui área própria e edição de cadastro. As rotas clínicas permitem solicitar consultas, enviar preparação e registrar acompanhamentos, conforme suas permissões e vínculos.
- **Médico (`doctor`):** possui área própria e cadastro profissional. As rotas clínicas permitem administrar consultas vinculadas, consultar resumos e registrar orientações.
- **Administrador (`admin`):** pode acessar as duas áreas e gerenciar nome/e-mail dos usuários. O back-end também permite acesso administrativo aos registros clínicos, mantendo as regras de status das consultas.

Somente contas com perfil `doctor` aparecem na seleção de profissionais e podem receber novas solicitações como médico. Administradores mantêm suas permissões de gestão, mas não são listados como profissionais.

O cadastro público permite apenas paciente e médico. O perfil administrativo não é oferecido no formulário e não existe um comando de promoção no repositório atual.

Data de nascimento e gênero são opcionais. Gênero inclui autodescrição e a opção de não informar. Especialidade e CRM/UF também são opcionais; quando informado, o número do CRM deve vir acompanhado da UF. A validação desses campos verifica o formato e não consulta o conselho profissional nem aprova automaticamente o registro médico.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | React, JavaScript, HTML, React Router, React Bootstrap, Bootstrap e Sass |
| Comunicação HTTP | Axios |
| API | Node.js e Express |
| Persistência | MongoDB Atlas e Mongoose |
| Autenticação | Cookies HTTP-only, sessões no banco e hash de senha com `scrypt` |
| Hospedagem | Vercel Services: front-end e API no mesmo projeto |
| Teste existente | `node:test` e `node:assert` |

## Arquitetura

```mermaid
flowchart LR
    P["Paciente, médico ou administrador"] --> F["React + Bootstrap"]
    F <-->|"HTTP / JSON e cookie de sessão"| API["Node.js + Express"]
    API <-->|"Mongoose"| DB[("MongoDB Atlas")]
```

O navegador se comunica com a API. A conexão com o MongoDB é feita somente no back-end; a senha do banco não deve ser incluída em variáveis com prefixo `VITE_`.

Em desenvolvimento, o Vite encaminha `/api` para `http://127.0.0.1:3000`. Na Vercel, o arquivo `vercel.json` direciona `/api/*` para o serviço Express e os demais endereços para o front-end.

## Modelo de dados atual

O projeto utiliza documentos e referências por `ObjectId`, e não tabelas MySQL separadas por perfil.

| Coleção | Conteúdo principal |
| --- | --- |
| `users` | Nome, e-mail, hash da senha, perfil, nascimento, gênero, especialidade e CRM/UF |
| `sessions` | Hash do token de sessão, referência ao usuário e data de expiração |
| `appointments` | Referências ao paciente e médico, status, horário, remarcação e preparação embutida em `prep` |
| `followups` | Registros de acompanhamento vinculados ao paciente |
| `guidances` | Orientações, medicamentos e retorno, com referências ao paciente e médico |

```mermaid
flowchart LR
    S["sessions"] -->|"userId"| U["users"]
    A["appointments"] -->|"patientId / doctorId"| U
    A --- P["prep: motivo, sintomas, dúvidas e medicamentos"]
    F["followups"] -->|"patientId"| U
    G["guidances"] -->|"patientId / doctorId"| U
```

`prep` é um subdocumento da consulta, não uma coleção independente. Os modelos e índices estão em [`backend/src/models.js`](backend/src/models.js).

Os status das consultas são `Solicitada`, `Aceito`, `Remarcação solicitada`, `Concluída` e `Cancelada`. O banco possui um índice único para impedir duas consultas aceitas com o mesmo médico, dia e horário.

## Estrutura do projeto

```text
MedTrack/
├── backend/
│   ├── src/
│   │   ├── app.js          # Rotas, autenticação e autorização
│   │   ├── database.js     # Conexão compartilhada com MongoDB
│   │   ├── models.js       # Documentos, referências e índices
│   │   ├── helpers.js      # Validações e conversões
│   │   ├── profile.js      # Validação dos campos de perfil
│   │   ├── permissions.js  # Permissões dos perfis
│   │   └── server.js       # Inicialização do servidor local
│   ├── test/flow.test.js
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── styles/
│   ├── public/
│   ├── .env.example
│   └── package.json
├── .gitignore
├── vercel.json
├── DEPLOY.md
└── README.md
```

## Executando localmente

### Pré-requisitos

- Node.js **22.13.0 ou superior**, conforme `backend/package.json`, e npm.
- Acesso ao MongoDB Atlas ou uma instância local do MongoDB em execução.
- Para Atlas: usuário do banco com as permissões necessárias e IP da máquina autorizado na lista de acesso.

### Obter o projeto

```bash
git clone https://github.com/gabrmascarenhas/MedTrack.git MedTrack
cd MedTrack
```

### Back-end — primeiro terminal

```bash
cd backend
npm ci
```

Na primeira configuração, copie `.env.example` para `.env`. **Não substitua seu `.env` se ele já estiver configurado.**

Ajuste a variável `MONGODB_URI` no `.env` para seu banco. O exemplo usa MongoDB local:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/medtrack
PORT=3000
HOST=127.0.0.1
NODE_ENV=development
```

Para Atlas, substitua somente a conexão usando seus próprios dados:

```dotenv
MONGODB_URI=mongodb+srv://USUARIO:SENHA@SEU_CLUSTER.mongodb.net/medtrack
```

Inicie a API:

```bash
npm run serve
```

A API estará em `http://127.0.0.1:3000`. A rota `/api/health` retorna `{"ok":true,"db":"mongodb"}` quando a conexão necessária é estabelecida. Para reiniciar automaticamente ao alterar arquivos, existe também `npm run dev`.

### Front-end — segundo terminal

A partir da raiz do repositório:

```bash
cd frontend
npm ci --include=dev
```

Na primeira configuração, copie `.env.example` para `.env`, preservando arquivos já configurados. Para usar a API real:

```dotenv
VITE_API_URL=/api
VITE_USE_MOCK=false
```

Inicie a interface:

```bash
npm run dev
```

Abra `http://127.0.0.1:5173`. Mantenha os dois terminais abertos enquanto estiver usando o sistema local.

### Comandos úteis

| Pasta | Comando | Finalidade |
| --- | --- | --- |
| `backend` | `npm run serve` | Iniciar a API local |
| `backend` | `npm run dev` | Iniciar a API com reinício automático |
| `backend` | `npm test` | Executar o teste existente, se o banco de testes estiver configurado |
| `frontend` | `npm run dev` | Iniciar o Vite |
| `frontend` | `npm run build` | Compilar o front-end em `dist` |
| `frontend` | `npm run preview` | Visualizar a compilação; não inicia a API nem substitui o proxy de desenvolvimento |

### Modo de demonstração local

`VITE_USE_MOCK=true` ativa a autenticação simulada para os perfis de paciente e médico. Os botões de acesso demo usam os dados fictícios de `frontend/src/services/mock/db.js`; essas contas não são criadas automaticamente no Atlas.

Esse modo serve para explorar a interface e não comprova integração com o banco ou funcionamento das rotas clínicas. O modo padrão dos arquivos de exemplo é a API real (`false`). Reinicie o Vite depois de alterar o `.env`.

## Testes e validação

Existe um teste de integração em [`backend/test/flow.test.js`](backend/test/flow.test.js), usando o executor nativo do Node.js. Ele cobre um fluxo de paciente, médico, consulta, remarcação, orientação e acompanhamento diretamente na API.

Para executá-lo, disponibilize um banco isolado chamado **`medtrack_test`**, configure `MONGODB_URI_TEST` no ambiente do terminal e rode `npm test` na pasta `backend`.

Exemplo para MongoDB local:

```bash
MONGODB_URI_TEST='mongodb://127.0.0.1:27017/medtrack_test' npm test
```

Sem `MONGODB_URI_TEST`, esse teste é ignorado. Sua presença no repositório não significa que ele tenha sido executado com sucesso. Não use o banco da demonstração publicada para testes automatizados.

A coleção Postman, os testes de navegador com Playwright e o registro de evidências de usabilidade ainda precisam ser preparados.

## Publicação

O projeto está configurado e publicado na Vercel, com persistência no MongoDB Atlas. As instruções de importação, variáveis e rede estão em [`DEPLOY.md`](DEPLOY.md).

- Importe a **raiz do repositório**, mantendo os serviços `web` e `api` declarados em `vercel.json`.
- Configure `MONGODB_URI` somente no ambiente do servidor e `APP_ORIGIN` com a origem pública do site.
- A instalação do front-end usa `npm ci --include=dev`, pois Vite e Sass são necessários durante a compilação, mesmo com `NODE_ENV=production`.
- Os pushes para a branch de produção conectada à Vercel geram novos deploys.
- O site publicado não depende de terminais locais abertos.

## Trabalho em equipe

Front-end e back-end ficam no mesmo repositório. Cada integrante mantém seus próprios arquivos `.env`, que são ignorados pelo Git. Somente `.env.example`, sem credenciais reais, é compartilhado.

As dependências são recuperadas por `npm ci`, a partir dos arquivos `package.json` e `package-lock.json`. As pastas `node_modules` e `dist` não devem ser versionadas.

## Próximas entregas

- Validar ponta a ponta as telas clínicas integradas, incluindo criação, edição, remarcação, cancelamento, exclusão, orientações e acompanhamento.
- Conferir as permissões de paciente, médico e administrador e os estados de erro, conflito e carregamento.
- Implementar pesquisa e filtros por médico, data, status e perfil, conforme a tela.
- Preparar e executar testes de API, de navegador e de usabilidade, registrando resultados e problemas encontrados.
- Atualizar os requisitos, casos de uso, modelo de dados, wireframes, cronograma e relatório para refletir a implementação entregue.

## Equipe

| Integrante | Papel |
| --- | --- |
| Gabriel Meneses | Gerente de Projeto |
| Yuri Freitas | Design / UX-UI |
| Pedro Átila | Front-end |
| Fernando José | Back-end |
| Gabriel Mascarenhas | QA / Análise de Testes |
