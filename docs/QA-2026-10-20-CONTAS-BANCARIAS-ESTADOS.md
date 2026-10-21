# QA 8 — operações e carregamento das contas bancárias, 20/10/2026

## Correção do frontend

O componente permitia chamadas repetidas de salvar, definir principal e arquivar enquanto aguardava a API. O formulário continuava editável durante o envio, e uma resposta antiga da lista ou dos detalhes podia atualizar o estado após retentativa, troca de sessão ou saída da aba.

Os mesmos controles agora bloqueiam ações concorrentes. Salvar bloqueia antes da validação assíncrona; os campos ficam desabilitados durante a operação. Falha preserva o rascunho para repetir. Sucesso limpa os dados integrais digitados antes da recarga. Respostas antigas não publicam lista, reabrem formulário nem notificam outra sessão.

A consulta atual limpa registros anteriores enquanto carrega e distingue erro de vazio. Adicionar não abre com catálogo indisponível. Sem novos campos, ações, colunas ou mudanças no payload bancário; serviços/interceptors e máscaras existentes preservados.

## Checklist

- [x] Sete testes reproduziram as falhas no componente/template reais antes da correção.
- [x] Salvar bloqueia chamadas duplicadas, inclusive durante validação.
- [x] Principal/Arquivar bloqueiam chamadas duplicadas.
- [x] Campos existentes e cancelar/fechar bloqueados durante envio.
- [x] Erro mantém dados digitados; sucesso limpa dados integrais e recarrega antes de liberar ações.
- [x] Última consulta prevalece, registros antigos não ficam sob erro/nova busca.
- [x] Saída da aba e troca de sessão impedem atualização tardia/notificações.
- [x] 224 testes, lint, build e diff-check do lote aprovados.
- [ ] Publicação e reteste visual desktop/mobile em homologação.

Escritas, falhas e concorrência foram exercitadas por respostas controladas nos testes do componente. O reteste visual não exige criar, alterar, priorizar ou arquivar uma conta bancária de homologação. Não equivale a rehomologar todas as escritas financeiras nem resolve pendências de outros módulos.
