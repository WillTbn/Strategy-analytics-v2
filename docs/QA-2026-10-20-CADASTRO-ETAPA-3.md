# Cadastro — Etapa 3: Dados pessoais

Conferência local de 20/10/2026. Referência: Figma BaDXlWpxbIoY4azOaQnXgv, nó 6:25562.

## Tela e reaproveitamento

A composição usa RegistrationShell, LabelField, inputWhite, Quasar e os assets locais do cadastro: logo/máscara e seta. O chevron do Figma foi baixado localmente (18 × 18). Logo 152 × 32,773 no slot 152 × 48, seta 24 × 24, seletores com chevron 18 × 18; dimensões carregadas conferidas no navegador. Gradientes e card de 760 px seguem o nó da etapa 3.

Somente nascimento, gênero, estado civil, nacionalidade(s), país e cidade de nascimento. Ações: Adicionar outra nacionalidade, Voltar e Continuar. Nenhum CPF, estado, exclusão, salvar separado ou seletor extra. Em celular, campos caem para uma coluna.

O rascunho de apresentação é separado de payload HTTP. Catálogos e obrigatórios entram por propriedades, sem inventar enums/IDs ou reinterpretar país/nacionalidade. Novo rascunho vazio por padrão; não há dados pessoais demonstrativos preenchidos na tela. Fixtures de opções existem somente em testes automatizados.

## Validação local

- 77 testes aprovados, sendo sete novos casos para datas, regras fornecidas, catálogos, duplicidade de nacionalidades, adição e isolamento/preservação do rascunho.
- Calendário real, bissextos e data não futura, sem impor idade mínima ou obrigatórios não confirmados.
- Escolhas conferidas contra opções recebidas. Adicionar outra nacionalidade exige preencher a anterior; uma linha extra vazia é tolerada, sem criar remoção ausente no Figma.
- Dados permanecem somente em memória na navegação local; cópias não compartilham arrays. Sem localStorage, sessionStorage, URL, log ou escrita HTTP de dados pessoais.
- Navegador: 31/02/2000 exibe erro e foca o campo; 29/02/2000 é aceito localmente. Seletor sem catálogo mostra Opções ainda indisponíveis. Continuar mantém a etapa com aviso, sem simular gravação/conclusão.
- Voltar abre etapa 2; retornar pelo histórico preserva nascimento e cidade. Desktop e celular 390 × 844 sem overflow horizontal. Assets carregados nas dimensões esperadas.
- Lint, build e diff do lote aprovados; telas do cadastro incluídas no build de homologação e fixtures de catálogo restritas aos testes.

Homologação: https://hml.strategyanalytics.com.br/cadastro/etapa-3; local: http://localhost:9010/cadastro/etapa-3. Banner identifica ausência de gravação/avanço integrado. O cadastro e o perfil integrados atuais permanecem preservados.

## Dependências para integração

O Swagger atual só possui catálogo administrativo de países; não há catálogos confirmados para os quatro seletores do cadastro. UpdateClientPersonalDetailsRequest aceita nacionalidade singular e não possui país de nascimento. Campos anuláveis não definem obrigatoriedade/idade do onboarding. PATCH /client/profile não confirma persistência e progresso das sete etapas. Não houve chamada administrativa para contornar isso, concatenação de nacionalidades ou gravação parcial apresentada como concluída.

Continuam pendentes sessão após confirmação de e-mail, catálogos/obrigatórios, país de nascimento, múltiplas nacionalidades, leitura/escrita/retomada e avanço para etapa 4. A adição com opções reais e o fluxo integrado ainda precisam de homologação. Checklist e pendências mantidos no Admin em docs/CHECKLIST-CADASTRO-SETE-ETAPAS.md e docs/PENDENCIAS-BACKEND-QA.md. Próxima implementação local: etapa 4.

## Publicação solicitada pelo usuário

As etapas 1–3 foram incluídas no build publicado, em rotas normais /cadastro/etapa-1, /cadastro/etapa-2 e /cadastro/etapa-3. Os aliases /dev/cadastro/etapa-* preservam os links anteriores. As páginas foram movidas de pages/dev para pages/registration. Banners identificam a homologação e a ausência de gravação/avanço; os adaptadores de apresentação das etapas 1–2 continuam sem executar criação/envio. A publicação visual não foi condicionada à conclusão do backend. /register e /confirm-email integrados permanecem disponíveis.
