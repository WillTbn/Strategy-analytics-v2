# Cadastro — Etapa 7: Revisão e envio

20/10/2026. Figma BaDXlWpxbIoY4azOaQnXgv, nós 9:25964 e 9:26067. Rotas /cadastro/etapa-7 e /cadastro/enviado.

## Composição e reutilização

Somente Dados pessoais, Endereço, Documento, Atividade trabalhista e Contatos de confiança, cinco ações Editar, confirmação de veracidade e Voltar/Enviar cadastro. Reutilizados RegistrationShell, rascunhos das etapas 3–6, validadores, logo/máscara e seta. Referência de envio com ícone original 56 px, card 560 px, textos e ação Ir para a Área do Cliente do desenho. Nenhum campo/ação adicional no card.

## Validações executadas

- 106 testes aprovados, incluindo oito cenários novos: grupos, whitelist sem segredos/arquivos, máscaras, precisão monetária/zero/ausência, catálogos sem IDs brutos, variante ativa sem mutação, ausência de contatos e pendências locais.
- Lint, build e diff do lote aprovados.
- Navegador desktop: vazio sem dados fictícios; envio sem confirmação mostra erro/foco; confirmação e grupos vazios mantêm a revisão com indicação das pendências. Nenhum transporte executado.
- Os cinco botões Editar abrem as etapas corretas. Voltar retorna à revisão, mantém alterações em memória e limpa a confirmação. Dados usados somente de teste; nenhum arquivo selecionado ou enviado.
- Documentos/telefones mascarados, sem nomes de arquivo, senha, código ou token; rótulos vêm de catálogo confirmado quando disponível. Renda R$ 1.234,56 e bens R$ 0,00 conferidos, sem transformar ausência em zero.
- Desktop e assets conferidos: logo 152 × 32,773 no slot 152 × 48; seta 24 × 24; ícone de enviado 56 × 56. Conferência móvel pendente: a API de viewport aceitou 390 × 844 mas a página permaneceu em 1280 px. Override restaurado; não registrar aprovação responsiva sem evidência.

Os dados ficam somente em memória, sem storage/URL/logs; recarregar limpa o contexto. Editar usa apenas marcador de retorno review=1 na URL, sem dados cadastrais. Estado busy bloqueia ações; concorrência com transporte real ainda não homologada.

## Limite de integração

Enviar cadastro nunca navega para enviado nem altera perfil/status. /cadastro/enviado é referência de homologação identificada e não comprova envio. GET /client/onboarding/status existe; submit/resubmit de Data Intake também existem, mas seu uso no onboarding não está confirmado. Faltam contrato final, vínculo de rascunho/documentos/confirmação, idempotência, recibo/status, falha/reenvio e permissão real de edição. O bloqueio existente do perfil foi preservado.

As sete telas estão implementadas; o fluxo integrado e a homologação integral do cadastro continuam abertos. Checklist e documento de pendências do Admin atualizados.
