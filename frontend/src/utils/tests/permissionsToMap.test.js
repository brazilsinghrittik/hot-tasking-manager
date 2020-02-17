import { userCanMap } from '../projectPermissions';

it('READ_ONLY role USER can NOT map any project', () => {
  const userTeams = [
    {
      teamId: 7,
      name: 'My Private team',
      role: 'MAPPER',
    },
  ];
  const user = { mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
  const project1 = { mappingPermission: 'any', teams: [{ teamId: 7, role: 'MAPPER' }] };
  const project2 = { mappingPermission: 'teams', teams: [{ teamId: 7, role: 'MAPPER' }] };
  const project3 = { mappingPermission: 'level', teams: [{ teamId: 7, role: 'MAPPER' }] };
  const project4 = { mappingPermission: 'teamsAndLevel', teams: [{ teamId: 7, role: 'MAPPER' }] };
  expect(userCanMap(user, project1, userTeams)).toBe(false);
  expect(userCanMap(user, project2, userTeams)).toBe(false);
  expect(userCanMap(user, project3, userTeams)).toBe(false);
  expect(userCanMap(user, project4, userTeams)).toBe(false);
});

describe('PROJECTS with mappingPermission set to any', () => {
  it('CAN be mapped by a BEGINNER user that is not on a team', () => {
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { mappingPermission: 'any', teams: [] };
    const project2 = { mappingPermission: 'any', teams: [{ teamId: 7, role: 'MAPPER' }] };
    expect(userCanMap(user, project1)).toBe(true);
    expect(userCanMap(user, project2)).toBe(true);
  });
});

describe('PROJECTS with mappingPermission set to level', () => {
  it('can NOT be mapped by a BEGINNER level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { mappingPermission: 'level', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(false);
  });

  it('CAN be mapped by an INTERMEDIATE level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
    const project1 = { mappingPermission: 'level', teams: [{ teamId: 7, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(true);
  });

  it('CAN be mapped by an ADVANCED level USER', () => {
    const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
    const project = { mappingPermission: 'level', teams: [{ teamId: 7, role: 'MAPPER' }] };
    expect(userCanMap(user, project)).toBe(true);
  });
});

describe('PROJECTS with mappingPermission set as teams', () => {
  it('CAN be mapped by a BEGINNER level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    const project2 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    const project3 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(true);
    expect(userCanMap(user, project2, userTeams)).toBe(true);
    expect(userCanMap(user, project3, userTeams)).toBe(true);
  });

  it('CAN be mapped by an INTERMEDIATE level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    const project2 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    const project3 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(true);
    expect(userCanMap(user, project2, userTeams)).toBe(true);
    expect(userCanMap(user, project3, userTeams)).toBe(true);
  });

  it('CAN be mapped by an ADVANCED level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
    const project = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project, userTeams)).toBe(true);
  });

  it('can NOT be mapped by a BEGINNER level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(false);
  });

  it('can NOT be mapped by an INTERMEDIATE level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(false);
  });

  it('can NOT be mapped by an ADVANCED level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teams', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(false);
  });
});

describe('PROJECTS with mappingPermission set to teamsAndLevel', () => {
  it('can NOT be mapped by a BEGINNER level USER even if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
      {
        teamId: 3,
        name: 'My Private team',
        role: 'PROJECT_MANAGER',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teamsAndLevel', teams: [{ teamId: 1, role: 'MAPPER' }] };
    const project2 = {
      mappingPermission: 'teamsAndLevel',
      teams: [{ teamId: 2, role: 'VALIDATOR' }],
    };
    const project3 = {
      mappingPermission: 'teamsAndLevel',
      teams: [{ teamId: 3, role: 'PROJECT_MANAGER' }],
    };
    expect(userCanMap(user, project1, userTeams)).toBe(false);
    expect(userCanMap(user, project2, userTeams)).toBe(false);
    expect(userCanMap(user, project3, userTeams)).toBe(false);
  });

  it('CAN be mapped by an INTERMEDIATE level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
      {
        teamId: 3,
        name: 'My Private team',
        role: 'PROJECT_MANAGER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teamsAndLevel', teams: [{ teamId: 1, role: 'MAPPER' }] };
    const project2 = {
      mappingPermission: 'teamsAndLevel',
      teams: [{ teamId: 2, role: 'VALIDATOR' }],
    };
    const project3 = {
      mappingPermission: 'teamsAndLevel',
      teams: [{ teamId: 3, role: 'PROJECT_MANAGER' }],
    };
    expect(userCanMap(user, project1, userTeams)).toBe(true);
    expect(userCanMap(user, project2, userTeams)).toBe(true);
    expect(userCanMap(user, project3, userTeams)).toBe(true);
  });

  it('can NOT be mapped by an INTERMEDIATE level USER if they are not member of a team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'MAPPER' };
    const project1 = { mappingPermission: 'teamsAndLevel', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project1, userTeams)).toBe(false);
  });

  it('CAN be mapped by an ADVANCED level USER if they are member of a team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
    const project = { mappingPermission: 'teamsAndLevel', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project, userTeams)).toBe(true);
  });

  it('can NOT be mapped by an ADVANCED level USER if they are not member of a team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'MAPPER' };
    const project = { mappingPermission: 'teamsAndLevel', teams: [{ teamId: 1, role: 'MAPPER' }] };
    expect(userCanMap(user, project, userTeams)).toBe(false);
  });
});

/******  PRIVATE PROJECTS  ******/
describe('PRIVATE projects', () => {
  it('can NOT be mapped by a READ_ONLY role USER even if the user is on the list', () => {
    const user = { username: 'user1', mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
    const project = {
      private: true,
      mappingPermission: 'teams',
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanMap(user, project)).toBe(false);
  });

  it('can NOT be mapped by an ADVANCED user if their username is NOT ALLOWED', () => {
    const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'MAPPER' };
    const project = {
      mappingPermission: 'teams',
      private: true,
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanMap(user, project)).toBe(false);
  });

  it('CAN be mapped by a BEGINNER USER if their username is ALLOWED', () => {
    const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project = {
      mappingPermission: 'teams',
      private: true,
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanMap(user, project)).toBe(true);
  });

  it('CAN be mapped by a BEGINNER USER if they are part of a team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'MAPPER',
      },
    ];
    const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project = {
      mappingPermission: 'teams',
      private: true,
      allowedUsernames: [],
      teams: [{ teamId: 1, role: 'MAPPER' }],
    };
    expect(userCanMap(user, project, userTeams)).toBe(true);
  });
});
