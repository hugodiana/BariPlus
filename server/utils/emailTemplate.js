// ✅ NOVO FICHEIRO: server/utils/emailTemplate.js

const emailTemplate = (titulo, corpo, textoDoBotao, linkDoBotao) => {
    // Insira aqui o link para o seu logo. Pode ser um link do seu site ou de um serviço como o Imgur.
    const urlDoLogo = "https://i.imgur.com/yuUEruK.png"; // Exemplo: https://i.imgur.com/your-logo-link.png

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { background-color: #37715b; padding: 20px; text-align: center; }
            .header img { max-width: 150px; }
            .content { padding: 30px; text-align: center; line-height: 1.6; color: #555; }
            .content h1 { color: #2c3e50; }
            .button { display: inline-block; padding: 12px 25px; background-color: #007aff; color: #ffffff; text-decoration: none; border-radius: 8px; margin-top: 20px; }
            .footer { background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 12px; color: #7f8c8d; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${urlDoLogo}" alt="BariPlus Logo">
            </div>
            <div class="content">
                <h1>${titulo}</h1>
                <p>${corpo}</p>
                ${textoDoBotao && linkDoBotao ? `<a href="${linkDoBotao}" class="button">${textoDoBotao}</a>` : ''}
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} BariPlus. Todos os direitos reservados.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = emailTemplate;