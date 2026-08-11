export interface ComputeNodesDBRow {
    id: number;
    name: string;
    ipAddress: string;
    hostname: string;
    maxStreams: number;
    configDetails: string;
    framesFolderPath: string;
    sshMembername: string;
    sshPassword: string;
    gpuCount: number;
    isActive: boolean;
}
