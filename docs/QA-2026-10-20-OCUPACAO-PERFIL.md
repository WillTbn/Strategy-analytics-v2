# QA 8 — edição da atividade trabalhista, 20/10/2026

## Falha do frontend

Reproduzido em homologação: a seção abre Editar, mas Atividade Trabalhista Atual permanece um seletor desabilitado, pois o front exige um catálogo de occupations inexistente. O contrato profissional aceita occupation em texto livre; o cadastro já usa esse formato.

O campo existente passa a usar o QInput já utilizado pelos demais campos do perfil, com os mesmos rótulo, posição, estilo e largura. Gênero, estado civil e nacionalidades continuam com os catálogos reais. Não há campos, ações ou opções novos.

O salvamento profissional continua pelo serviço clientApi existente, preservando empregador, vigência e isCurrent. Uma mudança somente de ocupação não envia o perfil financeiro. O requisito de identificação aprovada continua valendo.

## Checklist

- [x] Bloqueio reproduzido na versão publicada antes da correção.
- [x] Ocupação deixa de depender de catálogo inexistente.
- [x] Campo de texto e estilo reutilizados do próprio formulário.
- [x] 207 testes existentes aprovados, incluindo mudança só de ocupação, preservação de metadados, ocupação vazia, validação financeira antes do lote, retry parcial e troca de sessão.
- [x] Lint, build e diff-check do lote aprovados.
- [ ] Publicação em homologação e reteste visual desktop/mobile.
- [ ] Salvamento de valor fictício e restauração do valor original, conferindo que o financeiro não mudou.

É correção independente do backend. Não solicitar catálogo de ocupações para liberar esse campo; não modifica as pendências de currencyId, documentos ou envio final do cadastro.
