# QA — datas e prazo dos investimentos, 20/10/2026

Correção complementar do perfil (QA 8), reutilizando os campos e o padrão visual já aprovado.

- [x] Data de início e vencimento: datas impossíveis e formatos inválidos bloqueados antes do HTTP, com validação nos inputs e no payload. Reutilizada a validação de calendário existente no cadastro.
- [x] Prazo em meses opcional: vazio permitido; informado exige inteiro maior que zero, em conformidade com o mínimo já definido no input.
- [x] Prazo indeterminado limpa vencimento/meses ocultos; datas bissextas e valores decimais preservados.
- [x] Quatro testes novos; os três cenários de rejeição falhavam antes da correção. Suíte completa com 247 testes aprovados.
- [x] Lint, build e diff da alteração aprovados. Publicação 117b421 (inclui 4a8bd8a), pipeline 39532851194 concluída com testes, build, upload e ativação aprovados.
- [x] Conta do Jorge em homologação: prazo 0 mostra “Informe um prazo maior que zero”; corrigir para 12 e limpar remove o erro; 1,5 mostra “Informe um número inteiro válido”. Datas 29/02/2024 e 29/02/2028 aceitas nos inputs. Formulário descartado sem gravação.
- [x] Desktop 1366 px e mobile 390 px conferidos no formulário existente. Mobile: documento 378 px; editor clientWidth/scrollWidth 317/317 px, sem overflow horizontal. Ausência de moeda mantém Salvar bloqueado; não houve criação de patrimônio.

Evidências: `cliente-investimento-prazo-validacao-hml.png` e `cliente-investimento-prazo-validacao-mobile-hml.png`, na pasta de evidências desta conversa.

Nenhum campo, ação ou regra de negócio de cronologia adicionada. Não se impõe data passada/futura ou relação entre início e vencimento sem contrato confirmado. Criação integrada na conta do Jorge continua bloqueada pelo currencyId indisponível para conta sem carteira. Os testes do payload são controlados e não criam patrimônio fictício.

## Publicação — execução dos testes

Pipeline 39532642622 interrompida no teste de cadastro por SIGSEGV do Node 20.20.2, reproduzido localmente (8 cenários executados antes da queda). O mesmo arquivo executou seus 11 cenários com sucesso no Node 24 local, assim como a suíte completa. CI alinhado ao Node 24 usado na validação, mantendo os testes, lint e build obrigatórios. A pipeline anterior de documentação 39532381239 também falhou pelo mesmo sinal; a versão funcional anterior 7262cfa foi publicada com sucesso na 39532153190.
