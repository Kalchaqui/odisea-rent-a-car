<div align="center">

![Futuristic Car](./public/futuristic-car.png)

# 🚗 Stellar Car Rental - dApp de Alquiler de Autos

</div>

<div align="center">

![Stellar](https://img.shields.io/badge/Stellar-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Soroban](https://img.shields.io/badge/Soroban-7D00FF?style=for-the-badge&logo=stellar&logoColor=white)

**Una aplicación descentralizada (dApp) moderna para alquiler de vehículos construida sobre la red Stellar con contratos inteligentes Soroban.**

[Características](#-características-principales) • [Tecnologías](#-stack-tecnológico) • [Instalación](#-instalación) • [Uso](#-uso)

</div>

---

## 📋 Descripción

**Stellar Car Rental** es una dApp descentralizada que permite a los usuarios alquilar vehículos de forma segura y transparente utilizando la blockchain de Stellar. La aplicación implementa un sistema completo de gestión de alquileres con roles diferenciados (Administrador, Propietario y Arrendatario), comisiones automáticas y contratos inteligentes ejecutados en Soroban.

### ✨ Características Principales

- 🎭 **Roles Multi-Usuario**: Sistema con tres tipos de usuarios:
  - **Administrador**: Gestiona el catálogo de vehículos y recibe comisiones
  - **Propietario**: Agrega vehículos al sistema y recibe pagos de alquileres
  - **Arrendatario**: Alquila vehículos disponibles en la plataforma

- 💰 **Sistema de Comisiones**: Comisión fija por vehículo configurable por el administrador al momento de crear cada auto

- 🔐 **Seguridad**: Contratos inteligentes auditados con `cargo-scout-audit`, operaciones aritméticas seguras y validaciones exhaustivas

- 🎨 **Interfaz Moderna**: UI futurista con tema oscuro, efectos de neón y gradientes azul/morado, diseñada con Tailwind CSS

- 🔗 **Integración Wallet**: Soporte para múltiples wallets Stellar (Freighter, xBull, Albedo) mediante Stellar Wallets Kit

- ⚡ **Transacciones Optimizadas**: Envío de transacciones Soroban optimizado vía RPC server con manejo robusto de errores

- 📊 **Gestión Completa**:
  - Registro y eliminación de vehículos
  - Alquiler con cálculo automático de días y depósitos
  - Retiro de fondos por propietarios
  - Retiro de comisiones acumuladas por administrador

---

## 🛠 Stack Tecnológico

### Smart Contract (Backend)

- **Rust** - Lenguaje principal para contratos inteligentes
- **Soroban SDK** - Framework de Stellar para contratos inteligentes
- **cargo-scout-audit** - Auditoría de seguridad de código

### Frontend

- **React 19** - Librería de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de estilos
- **Stellar SDK** - SDK oficial de Stellar
- **Stellar Wallets Kit** - Integración de wallets
- **React Router** - Navegación

### Blockchain

- **Stellar Testnet** - Red de pruebas
- **Soroban RPC** - Comunicación con la blockchain

---

## 📁 Estructura del Proyecto

```
my-project/
├── contracts/
│   └── rent-a-car/          # Contrato inteligente en Rust
│       ├── src/
│       │   ├── contract.rs   # Lógica principal del contrato
│       │   ├── storage/      # Módulos de almacenamiento
│       │   ├── methods/      # Métodos públicos del contrato
│       │   ├── events/       # Definición de eventos
│       │   └── tests/        # Suite de tests unitarios
│       └── Cargo.toml
│
├── src/                      # Frontend React
│   ├── components/           # Componentes reutilizables
│   │   ├── CarList.tsx      # Lista de vehículos
│   │   ├── CreateCarForm.tsx # Formulario de creación
│   │   └── AdminFeeManager.tsx # Gestión de comisiones
│   ├── pages/               # Páginas principales
│   │   ├── ConnectWallet.tsx
│   │   ├── Dashboard.tsx
│   │   └── RoleSelection.tsx
│   ├── services/            # Servicios de backend
│   │   ├── stellar.service.ts # Servicio Stellar
│   │   └── wallet.service.ts  # Servicio de wallets
│   ├── providers/           # Context providers
│   └── interfaces/          # Definiciones TypeScript
│
└── target/                  # Artefactos de compilación
```

---

## 🚀 Instalación

### Requisitos Previos

Asegúrate de tener instalado:

- [Rust](https://www.rust-lang.org/tools/install) (última versión estable)
- [Node.js](https://nodejs.org/) (v22 o superior)
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Stellar CLI](https://github.com/stellar/stellar-core)
- [cargo-scout-audit](https://github.com/crytic/scout-audit) (para auditoría)

### Pasos de Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/Kalchaqui/odisea-rent-a-car.git
   cd odisea-rent-a-car/my-project
   ```

2. **Instalar dependencias del frontend**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Edita `.env` y configura:

   ```env
   PUBLIC_CONTRACT_ADDRESS=tu_contrato_id_aqui
   PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
   ```

4. **Compilar el contrato inteligente**

   ```bash
   cd contracts/rent-a-car
   cargo build --target wasm32-unknown-unknown --release
   cargo build --target wasm32v1-none --release
   ```

5. **Ejecutar tests del contrato**
   ```bash
   cargo test
   ```

---

## 💻 Uso

### Modo Desarrollo

1. **Iniciar el servidor de desarrollo**

   ```bash
   npm run dev
   ```

2. **Abrir en el navegador**

   ```
   http://localhost:5173
   ```

3. **Conectar tu wallet**
   - Instala [Freighter](https://freighter.app/) o cualquier wallet compatible
   - Asegúrate de estar conectado a **Stellar Testnet**
   - Haz clic en "Connect Wallet" en la aplicación

### Funcionalidades por Rol

#### 👨‍💼 Administrador

- Agregar nuevos vehículos al catálogo
- Configurar comisión fija por vehículo
- Retirar comisiones acumuladas
- Eliminar vehículos del sistema

#### 🏠 Propietario

- Ver tus vehículos registrados
- Retirar fondos acumulados (solo cuando el vehículo está disponible)
- Consultar estado y balances de tus vehículos

#### 🚘 Arrendatario

- Explorar catálogo de vehículos disponibles
- Alquilar vehículos por períodos específicos
- Visualizar detalles de cada vehículo

---

## 🔒 Seguridad

Este proyecto implementa múltiples capas de seguridad:

- ✅ **Auditoría de código**: Revisión con `cargo-scout-audit`
- ✅ **Aritmética segura**: Uso de `checked_add`, `checked_sub` para prevenir overflow/underflow
- ✅ **Validaciones exhaustivas**: Verificación de permisos y estados antes de cada operación
- ✅ **Manejo de errores robusto**: Errores personalizados y mensajes claros
- ✅ **Autenticación**: Verificación mediante `require_auth()` en todas las operaciones críticas

---

## 📝 Contrato Inteligente

### Funciones Principales

```rust
// Administrador
add_car(owner, price_per_day, commission_amount)  // Agregar vehículo
remove_car(owner)                                  // Eliminar vehículo
withdraw_admin_fees(amount)                        // Retirar comisiones

// General
rental(renter, owner, total_days, amount)         // Alquilar vehículo
payout_owner(owner, amount)                        // Retirar fondos (propietario)
get_car_status(owner)                              // Obtener estado del vehículo
get_car_info(owner)                                // Obtener info del vehículo
```

### Estados del Vehículo

- **Available**: Disponible para alquiler
- **Rented**: Actualmente alquilado

---

## 🧪 Testing

Ejecutar la suite completa de tests:

```bash
cd contracts/rent-a-car
cargo test
```

Los tests cubren:

- ✅ Creación y eliminación de vehículos
- ✅ Proceso de alquiler completo
- ✅ Retiro de fondos por propietarios
- ✅ Validación de permisos y estados
- ✅ Manejo de casos de error

---

## 📦 Deployment

### Testnet

El contrato está desplegado en Stellar Testnet:

```
Contract ID: CAMIHIV3UABUKHUDDWT5G3OTFQS4HVZD2SPRVORKGCYL4BH672WDD4U6
```

Para desplegar tu propia instancia:

```bash
# Optimizar el contrato
cargo build --target wasm32-unknown-unknown --release
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/rent_a_cart.wasm

# Instalar y desplegar
stellar contract install --wasm target/wasm32-unknown-unknown/release/rent_a_cart.optimized.wasm --network testnet
stellar contract deploy --id <CONTRACT_ID> --network testnet -- --admin <ADMIN_ADDRESS> --token <TOKEN_ADDRESS>
```

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👥 Autor

**Kalcha**

- GitHub: [@Kalchaqui](https://github.com/Kalchaqui)

---

## 🙏 Agradecimientos

- [Stellar Development Foundation](https://www.stellar.org/)
- [Scaffold Stellar](https://github.com/AhaLabs/scaffold-stellar) - Template inicial
- [Soroban Documentation](https://developers.stellar.org/docs/build/smart-contracts)

---

<div align="center">

**⭐ Si te gustó este proyecto, dale una estrella en GitHub ⭐**

Construido con ❤️ usando Stellar y Soroban

</div>
