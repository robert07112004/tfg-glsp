/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import 'reflect-metadata';

import {
    configureDefaultCommands,
    GlspSocketServerLauncher,
    GlspVscodeConnector,
    SocketGlspVscodeServer
} from '@eclipse-glsp/vscode-integration/node';
import * as path from 'path';
import * as process from 'process';
import * as vscode from 'vscode';
import ErEditorProvider from './er-editor-provider';

export const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

const DEFAULT_SERVER_PORT = '0';

/** VS Code context key that controls whether the Generate SQL button is visible. */
const VALIDATION_CLEAN_CONTEXT = 'er.validationClean';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // SQL button starts hidden: the user must explicitly validate with 0 errors first.
    vscode.commands.executeCommand('setContext', VALIDATION_CLEAN_CONTEXT, false);

    let serverProcess: GlspSocketServerLauncher | undefined;

    if (process.env.ER_SERVER_DEBUG !== 'true') {
        const modulePath = vscode.Uri.joinPath(context.extensionUri, 'dist', 'er-glsp-server.js').fsPath;
        serverProcess = new GlspSocketServerLauncher({
            executable: modulePath,
            socketConnectionOptions: { port: JSON.parse(process.env.ER_SERVER_PORT || DEFAULT_SERVER_PORT) },
            additionalArgs: ['--no-consoleLog', '--fileLog', '--logDir', LOG_DIR],
            logging: true
        });
        context.subscriptions.push(serverProcess);
        await serverProcess.start();
    }

    const minimalServer = new SocketGlspVscodeServer({
        clientId: 'glsp.er',
        clientName: 'er',
        connectionOptions: { port: serverProcess?.getPort() || JSON.parse(process.env.ER_SERVER_PORT || DEFAULT_SERVER_PORT) }
    });

    const glspVscodeConnector = new GlspVscodeConnector({
        server: minimalServer,
        logging: true,
        onBeforeReceiveMessageFromServer: (message, callback) => {
            const msg = message as any;
            if (msg?.action) {
                const action = msg.action;

                if (action.kind === 'setMarkers') {
                    const reason = action.reason as string | undefined;
                    const hasErrors = (action.markers ?? []).some((m: any) => m.kind === 'error');

                    if (reason === 'batch') {
                        // User explicitly pressed the validate button.
                        // Enable or disable based on whether there are errors.
                        vscode.commands.executeCommand('setContext', VALIDATION_CLEAN_CONTEXT, !hasErrors);
                    } else if (hasErrors) {
                        // Automatic live validation found errors → disable button.
                        // If no errors in live validation, keep the current state unchanged
                        // so auto-validation at load does NOT falsely enable the button.
                        vscode.commands.executeCommand('setContext', VALIDATION_CLEAN_CONTEXT, false);
                    }
                }

                // Any model modification requires re-validation before generating SQL.
                if (action.kind === 'setDirtyState' && action.isDirty === true) {
                    vscode.commands.executeCommand('setContext', VALIDATION_CLEAN_CONTEXT, false);
                }
            }
            callback(message, true);
        }
    });

    const customEditorProvider = vscode.window.registerCustomEditorProvider(
        'er.glspDiagram',
        new ErEditorProvider(context, glspVscodeConnector),
        {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false
        }
    );

    context.subscriptions.push(minimalServer, glspVscodeConnector, customEditorProvider);
    minimalServer.start();

    configureDefaultCommands({ extensionContext: context, connector: glspVscodeConnector, diagramPrefix: 'er' });

    context.subscriptions.push(
        vscode.commands.registerCommand('er.generateSql', () => {
            glspVscodeConnector.sendActionToActiveClient({ kind: 'generateSql' });
        })
    );
}
