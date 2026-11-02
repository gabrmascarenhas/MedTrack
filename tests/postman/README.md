# Testes de API — MedTrack

Esta coleção contém 15 cenários em 44 requisições, com 95 verificações automáticas.
Foi executada em 02/11/2026 pelo Newman 6, usando a API Express real em
http://127.0.0.1:3000/api e o MongoDB configurado no backend.
Resultado: 44 requisições executadas, 95 verificações aprovadas, nenhuma falha.
A execução levou 10,8 segundos. Evidência: Resultados-2026-11-02.xml (JUnit).

## Abrir no Postman

1. Inicie a API: dentro de backend, execute `npm run server`.
2. No Postman, clique em Import e escolha MedTrack.postman_collection.json
   e MedTrack-Local.postman_environment.json desta pasta.
3. Selecione o ambiente MedTrack Local no seletor de ambientes.
4. Abra a coleção MedTrack — 15 cenários de API e clique em Run.
5. Mantenha as 44 requisições selecionadas, na ordem, com uma iteração.
6. Execute e confira os resultados e as verificações individuais.

No editor, Body > raw contém o JSON enviado. Scripts > Post-response contém
as verificações `pm.test`. Os scripts guardam os IDs de contas e consultas
em variáveis da coleção e reutilizam esses valores nas próximas requisições.
Os logins alternam a sessão via cookie automaticamente.
Não rode requisições isoladas sem seus passos anteriores: várias dependem
dos IDs e da sessão criados durante a rodada.

## Dados criados

Cada rodada usa um identificador aleatório nos e-mails @example.test e cria:
- Dois pacientes e um médico fictícios, com nome iniciado por QA.
- Duas consultas: uma termina concluída e outra cancelada.
- Uma orientação médica fictícia.

Os registros permanecem no banco para inspeção; nenhuma exclusão é realizada.
A senha na coleção é exclusiva dessas contas fictícias, não é uma credencial
real existente. Não troque por senhas de usuários reais nem pela senha do Atlas.
A URL é local, mas o banco acessado é o definido no backend: isso não isola
os dados automaticamente em um banco de testes. Para rodadas recorrentes,
use uma instância de backend ligada a um banco de testes separado.
A coleção só permite a URL local prevista, evitando envios acidentais a outro site.

## Cobertura

1. Cadastro de paciente e ausência de senha/hash na resposta.
2. Cadastro de médico com especialidade, CRM e UF.
3. Rejeição de e-mail duplicado (409).
4. Cadastro inválido: e-mail, senha, nascimento futuro, CRM sem UF e role admin.
5. Edição e persistência de nome, nascimento e gênero autodescrito.
6. Impedir elevação para admin e acesso à listagem administrativa.
7. Solicitação de consulta com preparação e participantes corretos.
8. Bloqueio de aceite por paciente e conclusão de consulta pendente pelo médico.
9. Outro paciente não acessa, cancela ou altera a consulta alheia.
10. Rejeição de data passada, aceite futuro e visualização pelo paciente.
11. Solicitação de remarcação pelo paciente.
12. Confirmação do novo horário pelo médico.
13. Orientação salva pelo médico e visível ao paciente.
14. Conclusão, persistência e bloqueio de cancelamento após conclusão.
15. Cancelamento de outra consulta, persistência e bloqueio de remarcação.

## Limites desta rodada

Não cobre toda a API nem a interface. Não inclui fluxo completo de administrador,
conflito simultâneo de horários, expiração real de sessão, carga ou acessibilidade.
Os testes de navegador com Playwright ainda não foram preparados ou executados.
O XML registra verificações, sem cookies, senhas ou corpos das respostas.
A coleção foi executada pelo Newman; a interface do Postman não foi controlada.
