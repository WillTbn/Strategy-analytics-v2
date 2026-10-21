# QA — preferências e sessão, 20/10/2026

Escopo: correção funcional dos controles existentes de preferências. Nenhum campo, ação ou alteração visual adicionada.

- [x] Operações descartadas ao sair da tela não iniciam consultas adicionais de perfil ou confirmação.
- [x] Troca de sessão invalida leituras, retornos de gravação e escrita de preferências carregadas pela sessão anterior.
- [x] Gravação aceita, mas sem confirmação, mantém os valores enviados e desabilita novas escritas até recarga bem-sucedida. Mensagem e controles existentes reutilizados.
- [x] Falha da gravação mantém a recuperação anterior; país e tema preservados.
- [x] Sete regressões novas; suíte completa com 243 testes aprovados. Os seis primeiros cenários falhavam antes da correção.
- [x] Publicado em 7262cfa; pipeline 39532153190 concluída com sucesso (lint, testes, build, upload e ativação).
- [x] Conta do Jorge em homologação: BRL/USD, English (United States) e UTC carregados; seletor de idioma aberto/fechado sem gravar. Dados cadastrais preservados.
- [x] Desktop 1366 px e mobile 390 px conferidos; documento com larguras 1354/378 px, sem overflow horizontal da página. Lint/build e diff da alteração aprovados.

Evidências: `cliente-preferencias-sessao-hml.png` e `cliente-preferencias-sessao-mobile-hml.png`, na pasta de evidências desta conversa.

Falhas de rede e troca de sessão verificadas em testes controlados; não provocadas no servidor. Esta rodada não resolve o incidente histórico de identidade do QA, nem substitui sua revalidação independente. Dependências do backend permanecem no documento consolidado.
