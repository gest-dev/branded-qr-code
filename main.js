const dotenv = require('dotenv')
const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
dotenv.config()
const app = express();
const upload = multer({ dest: 'logos/' });

app.use(express.static('public')); // Servir a pasta public

// Endpoint para gerar o QR Code
app.post('/generate', upload.single('logo'), async (req, res) => {
  const { url, darkColor, lightColor } = req.body;
  const logoPath = req.file?.path;

  if (!url) {
    return res.status(400).send('URL é obrigatória!');
  }

  try {
    const qrCodePath = 'public/qrcode.png';

    // Gerar QR Code com as cores fornecidas
    await QRCode.toFile(qrCodePath, url, {
      color: {
        dark: darkColor || '#000000',  // Cor do QR Code (default: preto)
        light: lightColor || '#ffffff', // Cor de fundo do QR Code (default: branco)
      },
      width: 500,
    });

    if (logoPath) {
      // Se logo for fornecido, adicionar o logo ao QR Code
      const qrImage = await Jimp.read(qrCodePath);
      const logo = await Jimp.read(logoPath);

      // Ajustar o tamanho do logo para 20% do tamanho do QR Code
      const logoSize = qrImage.bitmap.width * 0.2;
      logo.resize(logoSize, logoSize);

      // Criar um fundo branco para o logo
      const background = new Jimp(logoSize + 20, logoSize + 20, 0xffffffff); // Fundo branco com padding de 10px

      // Centralizar o logo no fundo branco
      background.composite(logo, 10, 10);

      // Calcular a posição central do fundo branco no QR Code
      const xPos = (qrImage.bitmap.width - background.bitmap.width) / 2;
      const yPos = (qrImage.bitmap.height - background.bitmap.height) / 2;

      // Adicionar o fundo branco com o logo ao QR Code
      qrImage.composite(background, xPos, yPos);

      // Salvar o QR Code final
      await qrImage.writeAsync(qrCodePath);
    }

    // Remover a logo temporária
    if (logoPath) {
      fs.unlinkSync(logoPath);
    }

    res.sendFile(path.resolve(qrCodePath));
  } catch (error) {
    console.error('Erro ao gerar o QR Code:', error);
    res.status(500).send('Erro ao gerar QR Code.');
  }
});
const PORT = process.env.PORT || '3333'
// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
