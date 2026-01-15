import { useStore } from '@/store/useStore';

export const processCommand = (cmd: string, addLine: (l: any) => void, setLines: (l: any) => void, setPhase: (p: any) => void, lines: any[]) => {
    const args = cmd.trim().split(' ');
    const command = args[0].toLowerCase();

    let outputLines: { type: 'input' | 'output' | 'error' | 'system'; content: string }[] = [];

    switch (command) {
        case 'help':
            outputLines = [
                { type: 'output', content: 'DISPONIBLE:' },
                { type: 'output', content: '  contact  - Me joindre' },
                { type: 'output', content: '  projet   - Mes travaux' },
                { type: 'output', content: '  skills   - Competences' },
                { type: 'output', content: '  exit     - Quitter' },
            ];
            break;
        case 'contact':
        case 'about':
            outputLines = [
                { type: 'output', content: 'DEVELOPPEUR CREATIF // PARIS' },
                { type: 'output', content: 'Email: contact@example.com' },
                { type: 'output', content: 'Social: @github_handle' },
            ];
            break;
        case 'projet':
        case 'projects':
            outputLines = [
                { type: 'output', content: '--- SELECTION ---' },
                { type: 'output', content: '1. VELOCITY   | WebGL' },
                { type: 'output', content: '2. ARCHIMEDES | Micro' },
                { type: 'output', content: '3. NEURAL_NET | AI' },
            ];
            break;
        case 'skills':
            outputLines = [
                { type: 'output', content: 'TECH: React, Three.js, Go' },
                { type: 'output', content: 'UI/UX: Framer, Figma' },
            ];
            break;
        case 'clear':
        case 'cls':
            setLines([]);
            return;
        case 'exit':
            setPhase('ROOM');
            setLines([]);
            return;
        case '':
            return;
        default:
            outputLines = [{ type: 'error', content: `COMMANDE INCONNUE: ${command}` }];
    }

    const newLines = [
        { type: 'input', content: `guest@dev_os:~$ ${cmd}` },
        ...outputLines,
    ];

    setLines([...lines, ...newLines]);
};
