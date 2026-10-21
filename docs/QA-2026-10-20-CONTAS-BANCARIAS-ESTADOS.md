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
- [x] Publicação 154080a / [pipeline 39529228159](https://github.com/WillTbn/Strategy-analytics-v2/actions/runs/39529228159) aprovada.
- [x] Conta do usuário: Adicionar bloqueado até concluir consulta, lista vazia confirmada e formulário aberto com os mesmos campos/ações. Salvar vazio mostrou Campo obrigatório.
- [x] Cancelar/Fechar encerraram o formulário; reabertura sem erro/rascunho. Nenhum cadastro bancário, principal ou arquivamento realizado.
- [x] Desktop 1366 px e mobile 390 px conferidos. Documento e diálogo com clientWidth/scrollWidth 378/378 px no mobile. Viewport restaurado.
- [x] Evidências cliente-conta-bancaria-formulario-hml.png e cliente-conta-bancaria-formulario-mobile-hml.png.

Durante a animação de fechamento é necessário aguardar o diálogo encerrar antes de reabri-lo; após o encerramento, reabertura validada. Operações com resposta atrasada e bloqueio dos campos durante envio foram exercitadas automaticamente no componente real/template; não foram induzidas falhas de escrita no servidor.

Escritas, falhas e concorrência foram exercitadas por respostas controladas nos testes do componente. O reteste visual não exige criar, alterar, priorizar ou arquivar uma conta bancária de homologação. Não equivale a rehomologar todas as escritas financeiras nem resolve pendências de outros módulos.
