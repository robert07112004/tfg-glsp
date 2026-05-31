import 'reflect-metadata';

import { createAppModule, createSocketCliParser, ServerModule, SocketServerLauncher } from '@eclipse-glsp/server/node';
import { Container } from 'inversify';
import { ErDiagramModule } from './diagram/er-diagram-module';

export async function launch(argv?: string[]): Promise<void> {
    const options = createSocketCliParser().parse(argv);
    const appContainer = new Container();
    appContainer.load(createAppModule(options));

    const launcher = appContainer.resolve(SocketServerLauncher);
    const serverModule = new ServerModule().configureDiagramModule(new ErDiagramModule());

    launcher.configure(serverModule);
    launcher.start({ port: options.port, host: options.host });
}

launch(process.argv).catch(error => console.error('Error in tasklist server launcher:', error));
