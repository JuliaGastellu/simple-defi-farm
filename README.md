# 🌾 Simple DeFi Farm (Granja de Tokens Descentralizada)

¡Hola! Este es un proyecto sencillo para entender cómo funcionan las "granjas" de tokens en el mundo DeFi. Si alguna vez te preguntaste cómo la gente "deposita" sus criptos para ganar más, ¡este es un ejemplo básico de eso!

Aquí vas a encontrar un contrato inteligente (`TokenFarm`) que permite a los usuarios depositar sus tokens de liquidez (LP Tokens) y, a cambio, recibir recompensas en otro token (`DAppToken`). Es como poner tu dinero a trabajar para que te genere más dinero, pero todo en la blockchain.

---
### **Tecnologías Usadas**

Para que todo esto funcione, nos apoyamos en algunas herramientas clave del ecosistema blockchain:

* **Solidity:** El lenguaje con el que escribimos los contratos inteligentes. Es como el "idioma" que entienden las blockchains como Ethereum.
* **Hardhat:** Un entorno de desarrollo súper útil para Ethereum. Nos ayuda a compilar, desplegar, probar y verificar los contratos de forma sencilla.
* **OpenZeppelin Contracts:** Una biblioteca de contratos inteligentes ya probados y seguros. Usamos sus versiones de `ERC20` (para nuestros tokens) y `Ownable` (para la gestión de permisos), lo que nos ahorra mucho trabajo y nos da tranquilidad.
* **Ethers.js:** Una librería de JavaScript que nos permite interactuar con la blockchain desde nuestros scripts, como si fuera el "control remoto" de nuestros contratos.

## ¿Cómo funciona esto?

Tenemos tres contratos principales:

1.  **DAppToken:** Es el token que se usa para dar las recompensas. Imaginate que es el "premio" que ganás por participar.
2.  **LPToken:** Este representa tus "fichas de depósito" o "tokens de liquidez". Para simplificar, en este proyecto, los minteamos directamente, pero en el mundo real, los obtendrías al proveer liquidez en un exchange descentralizado (DEX).
3.  **TokenFarm:** Este es el cerebro de la operación. Aquí es donde depositás tus LP Tokens y donde se calculan y distribuyen las recompensas en DAppToken. También tiene un pequeño "fee" (comisión) por retirar las recompensas, que va al dueño de la granja.

---

## ¿Cómo usarlo (para desarrolladores)?

Si querés probar este proyecto o entenderlo a fondo, acá te dejo los pasos básicos. Necesitarás tener Node.js y Hardhat instalados.

1.  **Cloná el repositorio:**
    `git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git`
    `cd simple-defi-farm`

2.  **Instalá las dependencias:**
    `npm install`

3.  **Configurá tu entorno:**
    Creá un archivo `.env` en la raíz del proyecto y poné tus claves y URLs. Necesitarás:
    * `SEPOLIA_URL` (para conectarte a la red de prueba Sepolia)
    * `PRIVATE_KEY` (la clave privada de tu billetera con ETH de prueba)
    * `ETHERSCAN_API_KEY` (para verificar los contratos en Etherscan)

4.  **Desplegá los contratos:**
    `npx hardhat run scripts/deploy.js --network sepolia`
    **¡Importante!** Copiá las direcciones de los contratos (DAppToken, LPToken, TokenFarm) que te aparezcan en la terminal.

5.  **Actualizá el script de interacción:**
    Abrí `scripts/interact.js` y pegá las direcciones de los contratos que copiaste en el paso anterior.

6.  **Interactuá con la granja:**
    `npx hardhat run scripts/interact.js --network sepolia`
    Este script simula un usuario depositando, esperando, reclamando recompensas y retirando sus tokens. ¡Vas a ver cómo todo funciona paso a paso!

7.  **Verificá los contratos en Etherscan (opcional pero recomendado):**
    Una vez desplegados, podés hacerlos públicos y transparentes en Etherscan. Vas a necesitar los comandos específicos para cada contrato, que incluyen la ruta del archivo y los argumentos del constructor.

¡Y listo! Con esto podés explorar el funcionamiento básico de una granja DeFi. ¡Espero que te sea útil!