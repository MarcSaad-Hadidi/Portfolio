import type { Line, Phase } from '@/store/useStore';

type TerminalLine = Line;

const prompt = 'marc@workspace:~$';

export const commandNames = [
    'help',
    'about',
    'work',
    'projects',
    'project',
    'trouvable',
    'givn',
    'stocks',
    'stack',
    'skills',
    'contact',
    'resume',
    'cv',
    'why',
    'menu',
    'clear',
    'cls',
    'exit',
    'quit',
    'ls',
    'whoami',
];

const helpLines: TerminalLine[] = [
    { type: 'system', content: 'COMMANDS' },
    { type: 'output', content: 'about    - profile summary' },
    { type: 'output', content: 'work     - project list' },
    { type: 'output', content: '1 / 2 / 3 - open project details' },
    { type: 'output', content: 'trouvable / givn / stocks also work' },
    { type: 'output', content: 'stack    - technical toolkit' },
    { type: 'output', content: 'contact  - clickable links' },
    { type: 'output', content: 'resume   - education and experience' },
    { type: 'output', content: 'clear    - reset terminal' },
    { type: 'output', content: 'exit     - return to the 3D room' },
];

const projectDetails: Record<string, TerminalLine[]> = {
    '1': [
        { type: 'system', content: 'PROJECT_01: Trouvable' },
        { type: 'output', content: 'AI visibility platform for local businesses.' },
        { type: 'output', content: 'Next.js, Supabase, Clerk, Tailwind CSS.' },
        { type: 'output', content: 'Admin workspace, client portal, audit workflows.' },
        { type: 'output', content: 'Open website: Trouvable' },
    ],
    '2': [
        { type: 'system', content: 'PROJECT_02: Givn' },
        { type: 'output', content: 'Donation verification platform.' },
        { type: 'output', content: 'Next.js, TypeScript, Prisma, Tailwind CSS.' },
        { type: 'output', content: 'Reusable UI, dynamic pages, scalable structure.' },
        { type: 'output', content: 'Open website: Givn' },
    ],
    '3': [
        { type: 'system', content: 'PROJECT_03: Stocks' },
        { type: 'output', content: 'Interactive stock market dashboard.' },
        { type: 'output', content: 'Next.js, JavaScript, Tailwind CSS.' },
        { type: 'output', content: 'Market data UI, navigation, dynamic presentation.' },
        { type: 'output', content: 'Open website: Stocks' },
    ],
};

const aliases: Record<string, string> = {
    menu: 'help',
    skills: 'stack',
    contacts: 'contact',
    cv: 'resume',
    quit: 'exit',
    trouvable: 'project:1',
    givn: 'project:2',
    stocks: 'project:3',
    stock: 'project:3',
};

const withInput = (cmd: string, outputLines: TerminalLine[]): TerminalLine[] => [
    { type: 'input', content: `${prompt} ${cmd}` },
    ...outputLines,
];

export const processCommand = (
    cmd: string,
    setLines: (lines: Line[]) => void,
    setPhase: (phase: Phase) => void,
    lines: Line[]
) => {
    const [rawCommand, ...args] = cmd.trim().split(/\s+/);
    const rawLowerCommand = rawCommand.toLowerCase();
    const aliasedCommand = aliases[rawLowerCommand] ?? rawLowerCommand;
    const [command, aliasProjectId] = aliasedCommand.split(':');

    let outputLines: TerminalLine[] = [];

    switch (command) {
        case 'help':
            outputLines = helpLines;
            break;
        case 'ls':
            outputLines = [
                { type: 'output', content: 'about  work  stack  contact  resume  exit' },
            ];
            break;
        case 'whoami':
        case 'about':
            outputLines = [
                { type: 'system', content: 'PROFILE' },
                { type: 'output', content: 'Marc Saad-Hadidi' },
                { type: 'output', content: 'Software Engineering student at College de Bois-de-Boulogne.' },
                { type: 'output', content: 'Hands-on experience building full-stack web apps,' },
                { type: 'output', content: 'dashboards, and user-focused digital products.' },
                { type: 'output', content: 'Founder and project lead of Trouvable,' },
                { type: 'output', content: 'an AI visibility platform for local businesses.' },
                { type: 'output', content: 'Interested in architecture, modern web tech,' },
                { type: 'output', content: 'clean design, reliable functionality, and business value.' },
            ];
            break;
        case 'work':
        case 'projects':
            outputLines = [
                { type: 'system', content: 'KEY PROJECTS' },
                { type: 'output', content: '1. Trouvable | AI visibility platform' },
                { type: 'output', content: '2. Givn      | Donation verification' },
                { type: 'output', content: '3. Stocks    | Stock market dashboard' },
                { type: 'output', content: 'Type 1, trouvable, givn, or stocks.' },
            ];
            break;
        case '1':
        case '2':
        case '3':
            outputLines = projectDetails[command];
            break;
        case 'project': {
            const id = aliasProjectId ?? args[0] ?? '1';
            outputLines = projectDetails[id] ?? [
                { type: 'error', content: `Project not found: ${id}` },
                { type: 'output', content: 'Try: 1, 2, 3, trouvable, givn, or stocks.' },
            ];
            break;
        }
        case 'stack':
            outputLines = [
                { type: 'system', content: 'STACK' },
                { type: 'output', content: 'Languages: Python, C++, C, Java, SQL, JS, TS.' },
                { type: 'output', content: 'Web: Next.js, React, Angular, Node.js, NestJS.' },
                { type: 'output', content: 'Mobile/Desktop: Flutter, React Native, Electron.' },
                { type: 'output', content: 'Data/AI: PyTorch, Scikit-learn, Pandas, NumPy.' },
                { type: 'output', content: 'Cloud: Azure, AWS, GCP, Vercel, Docker.' },
                { type: 'output', content: 'DB: PostgreSQL, Supabase, Prisma, KDB+.' },
            ];
            break;
        case 'why':
            outputLines = [
                { type: 'system', content: 'WHY THIS PROFILE' },
                { type: 'output', content: 'I build complete products, not just screens.' },
                { type: 'output', content: 'I lead Trouvable from product to architecture.' },
                { type: 'output', content: 'I care about UX, maintainability, and delivery.' },
            ];
            break;
        case 'contact':
            outputLines = [
                { type: 'system', content: 'CONTACT' },
                { type: 'output', content: 'Phone: +1 (514) 715-2421' },
                { type: 'output', content: 'Email: hadidimarc@gmail.com' },
                { type: 'output', content: 'Location: Montreal, QC, Canada' },
                { type: 'output', content: 'GitHub: MarcSaad-Hadidi' },
                { type: 'output', content: 'LinkedIn: marcsaad-hadidi' },
            ];
            break;
        case 'resume':
            outputLines = [
                { type: 'system', content: 'RESUME' },
                { type: 'output', content: 'Education: DCS Software Engineering Technology.' },
                { type: 'output', content: 'College de Bois-de-Boulogne, 2024-present.' },
                { type: 'output', content: 'Experience: Founder & Project Lead, Trouvable.' },
                { type: 'output', content: 'Languages: French fluent, English fluent.' },
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
            outputLines = [
                { type: 'error', content: `Unknown command: ${command}` },
                { type: 'output', content: 'Type help, or try: 1, trouvable, givn, stocks.' },
            ];
    }

    setLines([...lines, ...withInput(cmd, outputLines)]);
};
