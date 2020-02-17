import { userCanValidate } from '../projectPermissions';

it('READ_ONLY role USER can NOT validate any project', () => {
  const userTeams = [
    {
      teamId: 7,
      name: 'My Private team',
      role: 'VALIDATOR',
    },
  ];
  const user = { mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
  const project1 = { validationPermission: 'any', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
  const project2 = { validationPermission: 'teams', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
  const project3 = { validationPermission: 'level', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
  const project4 = {
    validationPermission: 'teamsAndLevel',
    teams: [{ teamId: 7, role: 'VALIDATOR' }],
  };
  expect(userCanValidate(user, project1, userTeams)).toBe(false);
  expect(userCanValidate(user, project2, userTeams)).toBe(false);
  expect(userCanValidate(user, project3, userTeams)).toBe(false);
  expect(userCanValidate(user, project4, userTeams)).toBe(false);
});

describe('PROJECTS with validationPermission set to any', () => {
  it('CAN be validated by a BEGINNER user that is not on a team', () => {
    const user = { mappingLevel: 'BEGINNER', role: 'MAPPER' };
    const project1 = { validationPermission: 'any', teams: [] };
    const project2 = { validationPermission: 'any', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1)).toBe(true);
    expect(userCanValidate(user, project2)).toBe(true);
  });
});

describe('PROJECTS with validationPermission set to level', () => {
  it('can NOT be validated by a BEGINNER level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'level', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('CAN be validated by an INTERMEDIATE level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'level', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
  });

  it('CAN be validated by an ADVANCED level USER', () => {
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = { validationPermission: 'level', teams: [{ teamId: 7, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project)).toBe(true);
  });
});

describe('PROJECTS with validationPermission set as teams', () => {
  it('CAN be validated by a BEGINNER level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
      {
        teamId: 2,
        name: 'My Private team',
        role: 'PROJECT_MANAGER',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'teams', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    const project2 = {
      validationPermission: 'teams',
      teams: [{ teamId: 2, role: 'PROJECT_MANAGER' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
    expect(userCanValidate(user, project2, userTeams)).toBe(true);
  });

  it('CAN be validated by an INTERMEDIATE level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
      {
        teamId: 2,
        name: 'My Private team',
        role: 'PROJECT_MANAGER',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'teams', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    const project2 = {
      validationPermission: 'teams',
      teams: [{ teamId: 2, role: 'PROJECT_MANAGER' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
    expect(userCanValidate(user, project2, userTeams)).toBe(true);
  });

  it('CAN be validated by an ADVANCED level USER', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = { validationPermission: 'teams', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project, userTeams)).toBe(true);
  });

  it('can NOT be validated by a BEGINNER level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'teams', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('can NOT be validated by an INTERMEDIATE level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'teams', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('can NOT be validated by an ADVANCED level USER if they are NOT member of the team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project1 = { validationPermission: 'teams', teams: [{ teamId: 1, role: 'VALIDATOR' }] };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });
});

describe('PROJECTS with validationPermission set to teamsAndLevel', () => {
  it('can NOT be validated by a BEGINNER level USER even if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project1 = {
      validationPermission: 'teamsAndLevel',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('CAN be validated by an INTERMEDIATE level USER if they are member of the team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = {
      validationPermission: 'teamsAndLevel',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(true);
  });

  it('can NOT be validated by an INTERMEDIATE level USER if they are not member of a team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'INTERMEDIATE', role: 'VALIDATOR' };
    const project1 = {
      validationPermission: 'teamsAndLevel',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project1, userTeams)).toBe(false);
  });

  it('CAN be validated by an ADVANCED level USER if they are member of a team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'teamsAndLevel',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project, userTeams)).toBe(true);
  });

  it('can NOT be validated by an ADVANCED level USER if they are not member of a team', () => {
    const userTeams = [
      {
        teamId: 2,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'teamsAndLevel',
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project, userTeams)).toBe(false);
  });
});

/******  PRIVATE PROJECTS  ******/
describe('PRIVATE projects', () => {
  it('can NOT be validated by a READ_ONLY role USER even if the user is on the list', () => {
    const user = { username: 'user1', mappingLevel: 'ADVANCED', role: 'READ_ONLY' };
    const project = {
      private: true,
      validationPermission: 'teams',
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanValidate(user, project)).toBe(false);
  });

  it('can NOT be validated by an ADVANCED user if their username is NOT ALLOWED', () => {
    const user = { username: 'user3000', mappingLevel: 'ADVANCED', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'teams',
      private: true,
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanValidate(user, project)).toBe(false);
  });

  it('CAN be validated by a BEGINNER USER if their username is ALLOWED', () => {
    const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'teams',
      private: true,
      allowedUsernames: ['user1'],
      teams: [],
    };
    expect(userCanValidate(user, project)).toBe(true);
  });

  it('CAN be validated by a BEGINNER USER if they are part of a team', () => {
    const userTeams = [
      {
        teamId: 1,
        name: 'My Private team',
        role: 'VALIDATOR',
      },
    ];
    const user = { username: 'user1', mappingLevel: 'BEGINNER', role: 'VALIDATOR' };
    const project = {
      validationPermission: 'teams',
      private: true,
      allowedUsernames: [],
      teams: [{ teamId: 1, role: 'VALIDATOR' }],
    };
    expect(userCanValidate(user, project, userTeams)).toBe(true);
  });
});
