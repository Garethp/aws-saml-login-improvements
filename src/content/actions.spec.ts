import { Role, Group } from "./index";
import {
  addRole,
  removeRole,
  removeGroup,
  changeGroupName,
  changeRoleName,
} from "./actions";

describe("addRole", () => {
  let groups: Group[];
  const role: Role = {
    name: "name1",
    accountName: "account1",
    roleName: "role1",
  };

  beforeEach(() => {
    groups = [{ name: "group1", roles: [] }];
  });

  it("adds a role to a group that already exists", () => {
    expect(addRole(groups, "group1", role)).toEqual([
      { name: "group1", roles: [role] },
    ]);
  });

  it("adds a role to a new group", () => {
    expect(addRole(groups, "group2", role)).toEqual([
      { name: "group1", roles: [] },
      { name: "group2", collapsed: false, roles: [role] },
    ]);
  });
});

describe("removeRole", () => {
  let groups: Group[];

  beforeEach(() => {
    groups = [
      {
        name: "group1",
        roles: [
          { name: "name1", accountName: "account1", roleName: "roleName1" },
        ],
      },
    ];
  });

  it("removes a role from a group", () => {
    expect(removeRole(groups, "group1", "name1")).toEqual([
      { name: "group1", roles: [] },
    ]);
  });

  it("does not modify the groups array if the group does not exist", () => {
    expect(removeRole(groups, "group2", "role1")).toEqual(groups);
  });

  it("does not modify the groups array if the role does not exist in the group", () => {
    expect(removeRole(groups, "group1", "role2")).toEqual(groups);
  });
});

describe("removeGroup", () => {
  let groups: Group[];

  beforeEach(() => {
    groups = [
      { name: "group1", roles: [] },
      { name: "group2", roles: [] },
    ];
  });

  it("removes a group", () => {
    expect(removeGroup(groups, "group1")).toEqual([
      { name: "group2", roles: [] },
    ]);
  });

  it("does not modify the groups array if the group does not exist", () => {
    expect(removeGroup(groups, "group3")).toEqual(groups);
  });
});

describe("changeGroupName", () => {
  let groups: Group[];

  beforeEach(() => {
    groups = [{ name: "group1", roles: [] }];
  });

  it("changes the name of a group", () => {
    expect(changeGroupName(groups, "group1", "newName")).toEqual([
      { name: "newName", roles: [] },
    ]);
  });

  it("does not modify the groups array if the group does not exist", () => {
    expect(changeGroupName(groups, "group2", "newName")).toEqual(groups);
  });
});

describe("changeRoleName", () => {
  let groups: Group[];

  beforeEach(() => {
    groups = [
      {
        name: "group1",
        roles: [
          {
            name: "oldName",
            accountName: "account1",
            roleName: "roleName1",
          },
        ],
      },
    ];
  });

  it("changes the name of a role", () => {
    expect(changeRoleName(groups, "group1", "oldName", "newName")).toEqual([
      {
        name: "group1",
        roles: [
          {
            name: "newName",
            accountName: "account1",
            roleName: "roleName1",
          },
        ],
      },
    ]);
  });

  it("does not modify the groups array if the group does not exist", () => {
    expect(
      changeRoleName(groups, "group2", "oldRoleName", "newRoleName")
    ).toEqual(groups);
  });

  it("does not modify the groups array if the role does not exist in the group", () => {
    expect(
      changeRoleName(groups, "group1", "nonexistentRole", "newRoleName")
    ).toEqual(groups);
  });
});
