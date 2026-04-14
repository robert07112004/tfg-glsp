import 'reflect-metadata';

import { ContainerConfiguration } from '@eclipse-glsp/client';
import { GLSPStarter } from '@eclipse-glsp/vscode-integration-webview';

// @ts-ignore: Ignoramos el aviso de TypeScript sobre la importación de CSS
import '@eclipse-glsp/vscode-integration-webview/css/glsp-vscode.css';

import { initializeErDiagramContainer } from 'er-glsp-client';
import { Container } from 'inversify';

class ErStarter extends GLSPStarter {
    createContainer(...containerConfiguration: ContainerConfiguration): Container {
        // Hacemos un casting "as any" para evitar el conflicto de tipos internos de Inversify
        return initializeErDiagramContainer(new Container() as any, ...containerConfiguration);
    }
}

new ErStarter();