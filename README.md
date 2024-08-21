
# Rinho UDP Server

## Descripción

El **Rinho UDP Server** es un servidor diseñado para manejar la comunicación UDP con dispositivos AVL de **Rinho Telematics** (www.rinho.com.ar). Este servidor procesa mensajes entrantes, gestiona una cola de comandos, y asegura la recepción mediante el uso de ACKs. Además, soporta el parsing de reportes `CQ`.

## Características

- **Protocolos soportados:** Soporta y analiza reportes `CQ` de los dispositivos.
- **Cola de comandos:** Gestión eficiente de comandos enviados a los dispositivos, con confirmación de recepción mediante ACKs.
- **Conexión a base de datos:** Interfaz con bases de datos SQL para almacenar y gestionar los datos recibidos.
- **Cálculo de Checksum:** Implementa un sistema para calcular checksums y asegurar la integridad de los mensajes.

## Requisitos

- Node.js v14 o superior
- Base de datos SQL (MySQL, PostgreSQL, etc.)

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/fernandorvs/rinho-udp-server.git
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar los parámetros en `config.js`.

## Uso

1. Iniciar el servidor:
   ```bash
   npm start
   ```
2. El servidor estará escuchando en el puerto configurado para recibir datos de los dispositivos AVL y gestionar comandos.

## Estructura del Proyecto

- `app.js`: Punto de entrada de la aplicación.
- `protocol.js`: Contiene funciones clave para el parsing de mensajes `CQ` y el cálculo de checksums.
- `network.js`: Configuración y gestión de la red UDP, incluyendo el envío de ACKs.
- `db.js`: Conexión y operaciones de la base de datos, como la inserción de datos y la gestión de comandos.
- `util.js`: Funciones auxiliares y utilidades.
- `config.js`: Archivo de configuración que permite ajustar los siguientes parámetros:

  ### Parámetros de `config.js`:
  - **listeningPort**: Define el puerto en el que el servidor UDP estará escuchando los mensajes entrantes. Ejemplo: `5000`.
  - **deviceTimeToLive**: Especifica el tiempo en segundos que un dispositivo puede estar inactivo antes de ser considerado expirado y removido de la lista activa. Ejemplo: `60` segundos.
  - **retryTime**: Determina el intervalo de tiempo en segundos para reintentar el envío de comandos a los dispositivos en caso de fallos. Ejemplo: `10` segundos.
  - **mySqlHost**: La dirección del servidor MySQL donde se almacenarán los datos. Ejemplo: `localhost`.
  - **mySqlUser**: El nombre de usuario para conectarse a la base de datos MySQL. Ejemplo: `root`.
  - **mySqlPass**: La contraseña asociada al usuario de MySQL. Ejemplo: `""` (cadena vacía para sin contraseña).
  - **mySqlName**: El nombre de la base de datos donde se almacenan los datos recibidos de los dispositivos. Ejemplo: `rinho_udp`.

## Funciones Clave

### `parserCQ`

La función `parserCQ` en `protocol.js` es responsable de analizar los reportes `CQ` enviados por los dispositivos AVL. Estos reportes contienen datos críticos como coordenadas GPS, velocidad, y estado del encendido. La función utiliza una expresión regular para extraer estos valores y otros parámetros relevantes, transformándolos en un objeto estructurado que puede ser fácilmente almacenado en la base de datos o procesado por otras partes del sistema.

#### Campos extraídos de la trama `CQ`:

- **deviceId**: Identificador único del dispositivo.
- **reportType**: Tipo de reporte, en este caso `CQ`.
- **reportDateTime**: Fecha y hora del reporte.
- **latitude**: Latitud obtenida del GPS.
- **longitude**: Longitud obtenida del GPS.
- **speed**: Velocidad del dispositivo.
- **course**: Dirección o rumbo.
- **ign**: Estado del encendido.
- **inputs**: Estados de las entradas digitales.
- **outputs**: Estados de las salidas digitales.
- **voltageMainPower**: Voltaje de la fuente de alimentación principal.
- **odometer**: Valor del odómetro.
- **gpsPower**: Estado de la potencia del GPS.
- **gpsFixMode**: Modo de fijación del GPS.
- **gpsPdop**: Precisión del GPS (PDOP).
- **gpsQtySat**: Cantidad de satélites visibles.
- **gpsAge**: Edad de los datos GPS.
- **gsmPower**: Estado de la potencia GSM.
- **gsmStatus**: Estado del módulo GSM.
- **gsmLevel**: Nivel de señal GSM.
- **msgNum**: Número de mensaje asociado al reporte.
- **sourcePacket**: El paquete completo recibido.

## Advertencia

Este código es solo un ejemplo, diseñado para permitir la prueba y el aprendizaje en entornos controlados. No está destinado para uso en producción sin una implementación robusta y exhaustiva.

## Contribuir

Si deseas contribuir, por favor crea un fork del repositorio, realiza tus cambios y envía un pull request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT.
