# QA — datas e prazo dos investimentos, 20/10/2026

Correção complementar do perfil (QA 8), reutilizando os campos e o padrão visual já aprovado.

- [x] Data de início e vencimento: datas impossíveis e formatos inválidos bloqueados antes do HTTP, com validação nos inputs e no payload. Reutilizada a validação de calendário existente no cadastro.
- [x] Prazo em meses opcional: vazio permitido; informado exige inteiro maior que zero, em conformidade com o mínimo já definido no input.
- [x] Prazo indeterminado limpa vencimento/meses ocultos; datas bissextas e valores decimais preservados.
- [x] Quatro testes novos; os três cenários de rejeição falhavam antes da correção. Suíte completa com 247 testes aprovados.
- [ ] Lint, build, publicação e revisão desktop/mobile em homologação.

Nenhum campo, ação ou regra de negócio de cronologia adicionada. Não se impõe data passada/futura ou relação entre início e vencimento sem contrato confirmado. Criação integrada na conta do Jorge continua bloqueada pelo currencyId indisponível para conta sem carteira. Os testes do payload são controlados e não criam patrimônio fictício.
