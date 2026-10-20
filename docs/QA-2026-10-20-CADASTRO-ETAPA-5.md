# Cadastro — Etapa 5: Atividade trabalhista

20/10/2026. Figma BaDXlWpxbIoY4azOaQnXgv, nó 9:25789. Homologação em /cadastro/etapa-5.

## Tela e reaproveitamento

Quatro campos: Atividade trabalhista, Renda média mensal (R$), Renda média mensal da família (R$), Valor aproximado dos seus bens (R$). Orientação familiar e Voltar/Continuar iguais ao desenho. Nenhuma empresa, data, faixa, seletor de moeda ou ação adicional.

Reutilizados RegistrationShell, RegistrationDocumentField (primitiva neutra por props, com LabelField/inputWhite), Quasar e logo/máscara/chevron/seta locais. O campo compartilhado ganhou teclado decimal para money e preserva zero numérico com ??; datas e seletores da etapa 4 mantêm comportamento. Card 760 px, rendas lado a lado no desktop, patrimônio em 332 px máximo e todos os campos em uma coluna no celular. Ângulos de fundo/card próprios da etapa 5.

## Validação executada

- 91 testes aprovados (seis novos cenários para campos, moeda, inválidos, independência de erros, catálogos/regras e preservação). Rota verificada em build com DEV true/false.
- Lint, build e git diff do lote aprovados.
- Valores brasileiros não negativos, agrupamento correto e até dois centavos. Conversão para representação decimal textual preserva todos os dígitos, sem Number/float, arredondamento ou câmbio. Ponto decimal ambíguo e notação científica recusados.
- Vazio permanece vazio; zero explícito é válido. Obrigatórios e atividades vêm por propriedades confirmadas, sem catálogo fictício. Não foi imposta relação entre renda familiar e individual nem faixa de patrimônio.
- Navegador: negativos/agrupamento inválido exibem erros independentes e focam o primeiro campo; R$ 1.234,56, 2.000,00 e 0 aceitos localmente. Catálogo ausente mostra aviso e Continuar mantém a etapa, sem simular gravação.
- Voltar abre etapa 4; retorno pelo histórico preserva os três valores em memória. Sem storage, URL, log ou chamada HTTP dos dados.
- Desktop e celular 390 × 844 sem overflow horizontal. Assets carregados: logo 152 × 32,773 no slot 152 × 48, chevron 18 × 18 e seta 24 × 24. Nenhum asset novo necessário.

## Integração pendente

GET/PUT dos perfis profissional e financeiro já existem. occupation é string, sem catálogo confirmado para o seletor. Os requests exigem metadados de vigência: validFrom/validTo/isCurrent e effectiveFrom/effectiveTo/currencyCode. É necessário definir esses valores e o progresso do cadastro sem acrescentar campos ao Figma ou presumir datas/moeda/metadados do perfil atual.

Também faltam obrigatórios/precisão/limites do onboarding e retomada após falha parcial entre as duas gravações. A tela identifica R$ conforme o desenho, sem converter moedas. Nenhum perfil financeiro/profissional real foi gravado. Checklist e pendências no Admin atualizados; próxima tela incremental: etapa 6.
