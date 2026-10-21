# QA — preferências e sessão, 20/10/2026

Escopo: correção funcional dos controles existentes de preferências. Nenhum campo, ação ou alteração visual adicionada.

- [x] Operações descartadas ao sair da tela não iniciam consultas adicionais de perfil ou confirmação.
- [x] Troca de sessão invalida leituras, retornos de gravação e escrita de preferências carregadas pela sessão anterior.
- [x] Gravação aceita, mas sem confirmação, mantém os valores enviados e desabilita novas escritas até recarga bem-sucedida. Mensagem e controles existentes reutilizados.
- [x] Falha da gravação mantém a recuperação anterior; país e tema preservados.
- [x] Sete regressões novas; suíte completa com 243 testes aprovados. Os seis primeiros cenários falhavam antes da correção.
- [ ] Publicação e leitura desktop/mobile em homologação.

Falhas de rede e troca de sessão verificadas em testes controlados; não provocadas no servidor. Esta rodada não resolve o incidente histórico de identidade do QA, nem substitui sua revalidação independente. Dependências do backend permanecem no documento consolidado.
