# QA 8 — concorrência em Contratos e Termos, 20/10/2026

## Correção do frontend

As consultas de documentos dos contratos e de termos não distinguiam uma tentativa antiga da mais recente. Uma resposta antiga podia repor arquivos de uma leitura anterior, sobrescrever o erro atual ou encerrar o carregamento da retentativa. A paginação antiga também podia continuar buscando páginas após uma nova consulta.

Cada seção agora invalida suas próprias tentativas anteriores. Só a consulta atual da mesma sessão pode publicar arquivos, erro ou fim de carregamento. Sair da tela invalida as duas seções; uma consulta antiga não solicita páginas/documentos adicionais.

Preservados cards, títulos, textos, Baixar e Tentar novamente. Arquivos disponíveis continuam visíveis quando outro contrato falha, com o aviso de resultado parcial existente. Não foi alterado o contrato de termos nem criado context fictício.

## Checklist

- [x] Cinco cenários reproduzidos antes da correção executando o script real do componente.
- [x] Erro antigo não sobrescreve sucesso novo; detalhe antigo não substitui a falha mais recente.
- [x] Paginação superada interrompida antes da página seguinte.
- [x] Resposta antiga não encerra o loading de termos nem sobrescreve a leitura atual.
- [x] Saída da tela/troca de sessão impedem publicação e consultas filhas.
- [x] Falha parcial mantém arquivos disponíveis e não bloqueia a outra seção.
- [x] Template real distingue loading/erro de consulta vazia bem-sucedida e mantém a retentativa existente.
- [x] Suíte completa com 215 testes aprovada, lint/build e diff-check do lote.
- [x] Publicação 2b07793 / [pipeline 39528553525](https://github.com/WillTbn/Strategy-analytics-v2/actions/runs/39528553525) concluída com sucesso.
- [x] Na conta do usuário, Contratos apresentou o vazio após consulta concluída; Termos manteve indisponibilidade e Tentar novamente, sem interferir em Contratos. Retentativa e saída/retorno da aba conferidos.
- [x] Desktop 1366 px e mobile 390 px revisados; largura útil/rolagem 378/378 px. Viewport restaurado e nenhuma gravação cadastral, aceite ou link compartilhado.
- [x] Evidências: cliente-contratos-termos-estados-hml.png e cliente-contratos-termos-estados-mobile-hml.png.

A conta usada no navegador não possui documentos de contratos. A preservação de arquivos em falha parcial e os cenários fora de ordem foram validados automaticamente; esta rodada não homologa download de um arquivo real nem consulta de termos sem contexto confirmado.

Falhas e concorrência foram simuladas nos testes, sem interromper a API de homologação. Contexto dos consentimentos continua sendo a pendência real já documentada: o front não deve transformar indisponibilidade de termos em ausência de documentos.
