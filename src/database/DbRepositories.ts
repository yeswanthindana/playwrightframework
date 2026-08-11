import { FacilityRepository } from '@src/database/repositories/FacilityRepository';
import { ProfilesRepository } from '@src/database/repositories/ProfileRepository';
import { ComputeNodesRepository } from '@src/database/repositories/ComputeNodesRepository';
import { MemberRepository } from '@src/database/repositories/MemberRepository';
import { closeDb } from '@src/database/connection/DatabaseClient';

export class DbRepositories {
    public readonly facility: FacilityRepository;
    public readonly profile: ProfilesRepository;
    public readonly computeNodes: ComputeNodesRepository;
    public readonly member: MemberRepository;

    constructor() {
        this.facility = new FacilityRepository();
        this.profile = new ProfilesRepository();
        this.computeNodes = new ComputeNodesRepository();
        this.member = new MemberRepository();
    }

    async close(): Promise<void> {
        await closeDb();
    }
}
