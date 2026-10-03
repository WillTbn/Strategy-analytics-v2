# Integração do cadastro público — 02/10/2026

## Escopo entregue

- Cadastro público em `/register`, usando `POST /api/v1/auth/register`.
- Payload restrito a `name`, `email`, `password` e `referralCode` opcional.
- Confirmação pública em `/confirm-email`, também acessível pelo endereço antigo
  `/system/confirm-email`, sem exigir sessão.
- Confirmação em `POST /api/v1/auth/email-confirmation/confirm`, com `email` e `code`.
- Reenvio em `POST /api/v1/auth/email-confirmation/request`, com `email`.
- Chamadas públicas usam `clientApi` e idempotência, sem bearer ou refresh automático.
- Senha e código não são persistidos em armazenamento, URL ou logs do novo fluxo.
- Cadastro exige resposta `accepted: true`; confirmação exige `succeeded: true`.
- Reenvio tem intervalo de espera; respostas 429 respeitam `retryAfterSeconds`
  retornado no erro ou `Retry-After`.
- Dados complementares são preenchidos no Perfil autenticado. Não são enviados
  como campos desconhecidos no cadastro nem descartados após coleta.

## Evidência de chamada real

- Ambiente: `https://strategyanalytics.codebiz.com.br`.
- Horário: **02/10/2026, 18:11:03 (America/Sao_Paulo)**.
- Operação: `POST /api/v1/auth/email-confirmation/request`.
- Corpo: apenas `email`, usando o endereço Gmail autorizado pelo responsável
  (mascarado neste documento: `j***@gmail.com`).
- Status: **400**.
- Código: `users.email_invalid`.
- Campo: `email`.
- Mensagem: `A valid user email is required.`
- requestId: `01a0fe74d2a771fba525362c59955ea0`.
- correlationId: `01a0fe74d2a774bdb997338079de783e`.

Essa resposta não comprova envio ou recebimento de e-mail. Também não foi
classificada como defeito do backend: não foi confirmado que o endereço já tem
cadastro elegível à confirmação.

## Validação e pendências

- Quatro testes automatizados com transporte simulado aprovados: contrato do
  cadastro, confirmação/reenvio, preservação de erro 401 público e tratamento
  de limites. Não enviam mensagens nem criam contas.
- Confirmação pública abriu sem login no navegador.
- Cadastro real aguarda a definição e o envio da senha pelo responsável,
  diretamente na tela; a senha não deve ser compartilhada no chat.
- Recebimento do e-mail, código válido, ativação/vínculo automático do Customer e
  primeiro login ainda precisam ser homologados.
- `npm run lint` não executa com a configuração existente: ESLint 9 requer
  configuração flat, mas o projeto tem `.eslintrc.cjs`. Os arquivos alterados
  foram verificados separadamente com a configuração essencial Vue instalada.
- Dependências não foram atualizadas.
- Build SPA concluído com sucesso e `git diff --check` aprovado.
