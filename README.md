# Cuida — MVP

Aplicativo de página única para estoque de medicações, receitas e consultas, adaptado para celular.

## Publicação

Envie estes arquivos para a raiz da branch main de um repositório público. Em Settings → Pages, selecione Deploy from a branch → main → / (root) → Save. Não há instalação de dependências nem compilação.

## Cadastros e dados pessoais

O site começa vazio. Cadastros ficam no navegador, separados por endereço. Para migrar da prévia local, baixe o backup e restaure no site publicado ANTES de conectar o serviço de avisos. O backup contém dados pessoais e não deve ser enviado ao GitHub. Não há login nem sincronização automática dos cadastros entre celulares.

## Telegram

O serviço de avisos roda separadamente na Cloudflare. No site publicado, abra Avisos → Conectar serviço, informe a URL do Worker e sua ACCESS_KEY. Use a mesma configuração que já funciona na prévia. A chave do bot Telegram permanece apenas na Cloudflare; nunca deve ser colocada no site nem no repositório.

A sincronização envia somente os dados de compra. Receitas e consultas não são enviadas por Telegram nesta versão. Confira a última sincronização e faça um teste após migrar.

Limpar os dados do navegador remove os cadastros locais e a conexão local com os avisos; não pausa por si só o serviço na Cloudflare. Para interromper o envio, use Pausar avisos enquanto estiver conectado.
