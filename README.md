# Editor de Modelos Entidad/Relación para Visual Studio Code

Editor gráfico para el diseño de **modelos Entidad/Relación** y la **generación automática de código SQL**, desarrollado como extensión de Visual Studio Code sobre el framework [Eclipse GLSP](https://www.eclipse.org/glsp/).

Forma parte del Trabajo de Fin de Grado *"Desarrollo de un entorno web para el diseño de esquemas de bases de datos relacionales"*. 

La herramienta permite construir diagramas E/R con todos sus elementos (entidades fuertes y débiles, atributos de distintos tipos, interrelaciones, dependencias y jerarquías de especialización) y validar su corrección semántica. Una vez validado el esquema, genera de forma automática las sentencias `CREATE TABLE` correspondientes, aplicando las reglas de transformación del modelo E/R al modelo relacional, listas para ejecutarse en un sistema gestor de bases de datos.

## Estructura del proyecto

El proyecto está organizado como un *monorepo* gestionado con *workspaces* de Yarn, dividido en los siguientes paquetes:

- [`er-glsp-server`](./er-glsp-server): servidor del editor. Contiene la lógica del modelo, los manejadores de operaciones, el módulo de validación semántica y el motor de generación de SQL.
- [`er-glsp-client`](./er-glsp-client): cliente encargado del renderizado del diagrama y de las vistas gráficas de la notación de Chen.
- [`er-vscode`](./er-vscode): integración con Visual Studio Code.
  - [`extension`](./er-vscode/extension): extensión que arranca el servidor GLSP y registra el editor personalizado.
  - [`webview`](./er-vscode/webview): lienzo embebido que aloja al cliente dentro del editor.
- [`workspace`](./workspace): contiene archivos de ejemplo `.ermodel` que pueden abrirse con el editor.

## Requisitos previos

Para compilar y ejecutar el proyecto es necesario tener instalado en el sistema:

- [Node.js](https://nodejs.org/en/) `>= 20`
- [Yarn Classic](https://classic.yarnpkg.com/en/docs/install) `>= 1.7.0 < 2`
- [Visual Studio Code](https://code.visualstudio.com/)

Para empaquetar la extensión como archivo `.vsix` se utiliza [`@vscode/vsce`](https://github.com/microsoft/vscode-vsce), que ya viene incluido como dependencia de desarrollo del proyecto, por lo que no es necesario instalarlo de forma global.

> El usuario final que solo quiera **usar** la herramienta no necesita instalar ninguna de estas dependencias: basta con el archivo `.vsix` y Visual Studio Code (ver [Instalación de la extensión](#instalación-de-la-extensión)).

## Compilación del código fuente

Tras clonar el repositorio, instala las dependencias y compila todos los paquetes ejecutando, desde la raíz del proyecto:

```bash
yarn
```

Este comando descarga las dependencias de todos los *workspaces* y, mediante el script `prepare`, compila el código TypeScript y empaqueta el cliente y el servidor.

Si en algún momento necesitas recompilar sin reinstalar las dependencias, puedes usar:

```bash
yarn build      # compila (tsc) y empaqueta (webpack) todos los paquetes
yarn compile    # solo compila el código TypeScript
yarn clean      # elimina los artefactos de compilación
```

## Ejecución para pruebas

Para probar la extensión durante el desarrollo, abre la carpeta del proyecto en Visual Studio Code y ve a la vista **Run and Debug** (`Ctrl + Shift + D`). Hay disponibles varias configuraciones de arranque:

- **Launch ER Diagram Extension**: abre una segunda instancia de Visual Studio Code con la extensión ya instalada. El servidor GLSP se arranca como proceso embebido. Es la opción más cómoda para probar la herramienta.
- **Launch ER Diagram Extension (External GLSP Server)**: igual que la anterior, pero espera que el servidor GLSP se haya arrancado por separado. Útil para depurar el servidor.
- **Launch ER GLSP Server**: arranca manualmente el proceso del servidor GLSP. Permite poner puntos de interrupción en el código del servidor.
- **Launch ER Diagram extension with external GLSP Server**: configuración compuesta que arranca a la vez la extensión (en modo servidor externo) y el servidor GLSP, permitiendo depurar simultáneamente cliente y servidor.

Una vez lanzada la segunda instancia, abre la carpeta `workspace` y haz doble clic sobre cualquier archivo `.ermodel` para abrirlo con el editor Entidad/Relación.

Como alternativa, durante el desarrollo activo puedes mantener la recompilación automática en marcha con:

```bash
yarn watch
```

## Generación del archivo `.vsix`

Para empaquetar la extensión como un archivo `.vsix` distribuible, ejecuta desde la raíz del proyecto:

```bash
yarn package
```

Este comando compila y empaqueta todo el proyecto e invoca internamente a `vsce package`. El archivo resultante, `er-vscode-<versión>.vsix`, se genera dentro de la carpeta [`er-vscode/extension`](./er-vscode/extension).

## Instalación de la extensión

Con el archivo `.vsix` ya generado, puede instalarse en Visual Studio Code de dos maneras:

- **Desde la interfaz**: abre la vista de extensiones (`Ctrl + Shift + X`), despliega el menú `...` de la esquina superior y elige *Install from VSIX...*, seleccionando el archivo generado.
- **Desde la terminal**:

  ```bash
  code --install-extension er-vscode-2.5.0.vsix
  ```

Una vez instalada, la extensión se activa automáticamente al iniciar Visual Studio Code. Cualquier archivo con extensión `.ermodel` se abrirá directamente con el editor Entidad/Relación.

## Uso básico

1. Crea un archivo con extensión `.ermodel` y ábrelo para mostrar el lienzo y la paleta de herramientas.
2. Haz clic en un elemento de la paleta y después en el lienzo para colocarlo. Los elementos se renombran con doble clic.
3. Para crear una arista, selecciona su tipo en la paleta, haz clic en el elemento de origen y después en el de destino.
4. Pulsa el botón de **validación** para comprobar el esquema. Los errores se muestran como marcadores sobre los elementos afectados, con un mensaje que explica la causa.
5. Cuando la validación no detecta errores, aparece el botón de **generación de SQL**. Al pulsarlo se crea un archivo `.sql` junto al modelo con las sentencias `CREATE TABLE`.

## Licencia

Este proyecto se distribuye bajo la licencia EPL-2.0, heredada de la plantilla base de Eclipse GLSP.
