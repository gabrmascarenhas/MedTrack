# Publicação do MedTrack na Vercel

Esta configuração usa Vercel Services (beta), com React e Express no mesmo projeto e domínio.
Referência: https://vercel.com/docs/services

## Importação

1. Envie o código para o GitHub.
2. Na Vercel, escolha Add New > Project e importe este repositório.
3. Mantenha Root Directory na raiz do repositório (`.`). Não selecione apenas frontend ou backend.
4. O vercel.json declara os dois serviços e seus comandos. Não sobrescreva os comandos de build no painel.
5. Se o painel pedir um preset para o projeto raiz, escolha Other; os serviços têm seus próprios frameworks.

## Variáveis de ambiente

Configure no painel, sem enviar arquivos .env ao Git:

- MONGODB_URI: a URI completa do Atlas com a senha atual e o banco desejado. Nunca use prefixo VITE_ nesta variável.
- NODE_ENV: production.
- VITE_API_URL: /api.
- VITE_USE_MOCK: false.
- APP_ORIGIN: a origem HTTPS exata do site, por exemplo https://seu-projeto.vercel.app (sem caminhos).

Se ainda não souber o domínio, faça o primeiro deploy, copie a URL principal em Domains, configure APP_ORIGIN e faça Redeploy. Para domínios próprios, atualize APP_ORIGIN.
Use variáveis de Production para o site principal e variáveis de Preview para uma base de homologação separada.

## Acesso do Atlas

O IP liberado do notebook não libera a hospedagem. A Vercel usa IPs de saída dinâmicos por padrão.

- Para restringir a rede, configure Static IPs na Vercel (conforme disponibilidade e custo do plano) e libere os IPs indicados no Atlas.
- Uma entrada 0.0.0.0/0 permite conexões de qualquer IP, ainda exigindo autenticação. É uma opção mais ampla para demonstração e não deve ser confundida com uma lista restrita.

Use um usuário exclusivo da aplicação, com readWrite apenas no banco usado pelo site. Não reutilize a senha antiga que foi removida do Git.

## Rotas e funcionamento

- /api/*: Express. Aguarda a conexão ao MongoDB e evita cache das respostas.
- Demais endereços: frontend React.
- O fallback de SPA permite atualizar diretamente /login, /cadastro e as áreas autenticadas.
- O backend local continua usando npm run serve dentro de backend.
- O frontend local continua usando npm run dev dentro de frontend.

## Atualizações e verificação

Commits enviados à branch de produção conectada geram novos deploys. Outras branches podem gerar previews.
Depois do primeiro deploy, confira /api/health e o login. Não é necessário manter os terminais locais abertos para o site publicado funcionar.
Se houver falha, consulte Build Logs e Runtime Logs. Nunca compartilhe a URI ou a senha ao enviar logs.

A compilação local não substitui a verificação do primeiro deploy, das permissões de rede e dos cookies no domínio real.
