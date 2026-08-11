import { APIRequestContext } from '@playwright/test';
import { FacilityApiClient } from '@src/api/clients/FacilityApiClient';
import { ProfileApiClient } from '@src/api/clients/ProfileApiClient';
import { ComputeNodesApiClient } from '@src/api/clients/ComputeNodesApiClient';
import { MemberApiClient } from '@src/api/clients/MemberApiClient';

export class ApiClients {
  public readonly facility: FacilityApiClient;
  public readonly profile: ProfileApiClient;
  public readonly computeNodes: ComputeNodesApiClient;
  public readonly member: MemberApiClient;

  constructor(request: APIRequestContext) {
    this.facility = new FacilityApiClient(request);
    this.profile = new ProfileApiClient(request);
    this.computeNodes = new ComputeNodesApiClient(request);
    this.member = new MemberApiClient(request);
  }
}
