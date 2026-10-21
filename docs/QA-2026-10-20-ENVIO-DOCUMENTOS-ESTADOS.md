# QA 8/10 — envio documental e orientações, 20/10/2026

## Correção do frontend

O formulário permitia iniciar envios/substituições repetidos durante a validação ou envio, e os campos permaneciam editáveis. Além disso, uma consulta antiga de orientações podia sobrescrever o tipo/país atual ou notificar erro depois do fechamento da tela.

Os controles existentes agora ficam bloqueados durante o envio. A mesma operação não é disparada novamente; erro conserva arquivo/datas para retry, sucesso confirmado ou cancelamento limpa o arquivo da memória. A consulta de orientações fica vinculada ao tipo, país, abertura e sessão atuais. Respostas antigas da listagem também não substituem resultado/erro recentes.

Nenhum campo, ação, limite de arquivo ou metadado HTTP novo. Tipos, país, arquivo, emissão e validade e as ações Enviar/Cancelar/Fechar/Substituir foram preservados. Autenticação/idempotência continuam nos serviços existentes.

## Checklist

- [x] Seis falhas reproduzidas antes da correção pelo script real do componente.
- [x] Envio e substituição bloqueiam duplicidade antes de validar; fechamento não apaga rascunho durante envio.
- [x] Falha conserva arquivo/rascunho; sucesso limpa o arquivo antes da recarga.
- [x] Tipo/país antigos não sobrescrevem instruções; fechamento/saída invalida orientações e erros atrasados.
- [x] Troca de sessão impede envio após validação e notificações/recarga de resposta antiga.
- [x] Última consulta documental prevalece; erro e bloqueios reais não liberam upload.
- [x] Suíte completa com 231 testes, lint, build e diff-check do lote aprovados.
- [ ] Publicação e reteste visual desktop/mobile em homologação.

Envios, falhas e concorrência foram exercitados em testes controlados; não foram enviados documentos adicionais ao backend nesta rodada. O vínculo/metadados do replace e a regra CNH continuam pendências separadas; esta correção não altera nem contorna o guard de perfil/documentos.
