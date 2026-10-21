# QA 8 — descrições do catálogo no perfil, 20/10/2026

## Correção do frontend

Quando o perfil tinha nationalityCountryIds salvos, mas a descrição do país ainda não havia carregado ou estava ausente no catálogo, o campo aparecia como Não informado. Um catálogo parcial também ocultava silenciosamente as nacionalidades não resolvidas.

O mapeamento compartilhado pelo Perfil Completo e pelo resumo agora preserva os países conhecidos e informa Descrição indisponível quando há IDs sem nome resolvido. Não mostra UUIDs e não interpreta indisponibilidade de catálogo como ausência cadastral. O valor PreferNotToSay mantém tradução em português mesmo sem catálogo; quando disponível, o label real do catálogo continua prioritário.

Campos, seletores, rótulos, grid, botões e contrato de escrita preservados. Ausência real continua Não informado, e nacionalidade legada em texto continua sendo apresentada. Nenhum dado é gravado para resolver uma falha de leitura.

## Checklist

- [x] Três falhas reproduzidas antes da correção no mapeamento real.
- [x] Catálogo ausente/parcial não afirma ausência cadastral nem mostra IDs.
- [x] Catálogo completo recupera nomes sem alterar o perfil.
- [x] PreferNotToSay em português; labels do catálogo têm prioridade.
- [x] Ausência real e nacionalidade legada preservadas.
- [x] 236 testes, lint/build e diff-check do lote aprovados.
- [x] Publicação 0e0de79 / [pipeline 39531180021](https://github.com/WillTbn/Strategy-analytics-v2/actions/runs/39531180021) aprovada.
- [x] Leitura real do perfil preservou campos e ausência legítima de gênero/nacionalidade. Editor abriu os labels reais Feminino, Masculino, Outro e Prefiro não informar; seleção não foi alterada e edição descartada.
- [x] Desktop 1366 px/mobile 390 px revisados, largura útil/rolagem 378/378 px; viewport restaurado e nenhum PATCH de perfil.
- [x] Evidências cliente-perfil-descricoes-hml.png e cliente-perfil-descricoes-mobile-hml.png.

Catálogo faltante/incompleto foi exercitado nos testes automatizados; não foram removidos países nem induzida falha no backend. Na conta usada para revisão visual, nacionalidade está vazia e deve continuar Não informado; isso não reproduz artificialmente uma nacionalidade preenchida.
