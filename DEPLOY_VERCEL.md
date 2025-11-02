# 🚀 Guía para Desplegar en Vercel

## Pasos para Desplegar

### 1. Prepara tu repositorio Git

Asegúrate de que tu proyecto esté en GitHub, GitLab o Bitbucket:

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### 2. Conecta tu proyecto a Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Click en **"Add New Project"**
3. Conecta tu repositorio (GitHub/GitLab/Bitbucket)
4. Selecciona el proyecto `my-project`

### 3. Configura las Variables de Entorno

En la configuración del proyecto en Vercel, ve a **Settings > Environment Variables** y agrega:

```
PUBLIC_STELLAR_NETWORK=testnet
PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
PUBLIC_STELLAR_FRIENDBOT_URL=https://friendbot.stellar.org
PUBLIC_CONTRACT_ADDRESS=CAMIHIV3UABUKHUDDWT5G3OTFQS4HVZD2SPRVORKGCYL4BH672WDD4U6
```

### 4. Configura el Build

Vercel detectará automáticamente que es un proyecto Vite, pero asegúrate de que:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` (ya configurado en vercel.json)
- **Output Directory**: `dist` (ya configurado en vercel.json)
- **Install Command**: `npm install`

### 5. Despliega

1. Click en **"Deploy"**
2. Espera a que termine el build
3. ¡Listo! Tu app estará disponible en una URL de Vercel

## ⚙️ Configuración Adicional

### Variables de Entorno según Ambiente

Puedes configurar diferentes variables para:
- **Production**: Usa el contrato de producción y mainnet (cuando esté listo)
- **Preview**: Usa testnet para pruebas

En Vercel, puedes agregar variables específicas para cada ambiente.

### Notas Importantes

1. **Imagen del coche**: Asegúrate de que `public/futuristic-car.png` esté en el repositorio
2. **Assets estáticos**: Todo lo que esté en `public/` se servirá automáticamente
3. **Build**: El comando `npm run build` compilará TypeScript y creará los assets optimizados

## 🔧 Troubleshooting

Si el build falla:

1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de build en Vercel
3. Asegúrate de que `node_modules` esté en `.gitignore` (ya está)

## ✅ Listo para Producción

Una vez desplegado, tendrás:
- ✅ URL pública de Vercel
- ✅ Despliegues automáticos en cada push
- ✅ Preview deployments para pull requests
- ✅ SSL/HTTPS automático

¡Disfruta tu dApp desplegada! 🎉

