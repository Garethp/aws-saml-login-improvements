import { Group, Role } from "./index";

export const addRole = (groups: Group[], groupName, role: Role): Group[] => {
  if (!groups.some((group) => group.name === groupName))
    groups.push({ name: groupName, collapsed: false, roles: [] });

  groups.find((group) => group.name === groupName).roles.push(role);

  return groups;
};

export const removeRole = (
  groups: Group[],
  groupName: string,
  roleName: string
): Group[] =>
  groups.map((group) =>
    group.name !== groupName
      ? group
      : {
          ...group,
          roles: group.roles.filter((role) => role.name !== roleName),
        }
  );

export const removeGroup = (groups: Group[], groupName: string): Group[] =>
  groups.filter((group) => group.name !== groupName);
export const changeGroupName = (
  groups: Group[],
  oldName: string,
  newName: string
): Group[] =>
  groups.map((group) => {
    if (group.name !== oldName) return group;
    return {
      ...group,
      name: newName,
    };
  });

export const changeRoleName = (
  groups: Group[],
  groupName: string,
  oldRoleName: string,
  newRoleName: string
): Group[] =>
  groups.map((group) => {
    if (group.name !== groupName) return group;
    return {
      ...group,
      roles: group.roles.map((role) => {
        if (role.name !== oldRoleName) return role;
        return {
          ...role,
          name: newRoleName,
        };
      }),
    };
  });

export const moveGroupUp = (groups: Group[], groupName: string): Group[] => {
  const groupIndex = groups.findIndex((group) => group.name === groupName);
  if (groupIndex > 0) {
    const temp = groups[groupIndex - 1];
    groups[groupIndex - 1] = groups[groupIndex];
    groups[groupIndex] = temp;
  }
  return groups;
};

export const moveGroupDown = (groups: Group[], groupName: string): Group[] => {
  const groupIndex = groups.findIndex((group) => group.name === groupName);
  if (groupIndex < groups.length - 1 && groupIndex >= 0) {
    const temp = groups[groupIndex + 1];
    groups[groupIndex + 1] = groups[groupIndex];
    groups[groupIndex] = temp;
  }
  return groups;
};

export const moveRoleUp = (
  groups: Group[],
  groupName: string,
  roleName: string
): Group[] => {
  const group = groups.find((group) => group.name === groupName);
  if (!group) {
    return groups;
  }

  const roleIndex = group.roles.findIndex((role) => role.roleName === roleName);
  if (roleIndex > 0) {
    const temp = group.roles[roleIndex - 1];
    group.roles[roleIndex - 1] = group.roles[roleIndex];
    group.roles[roleIndex] = temp;
  }

  return groups;
};

export const moveRoleDown = (
  groups: Group[],
  groupName: string,
  roleName: string
): Group[] => {
  const group = groups.find((group) => group.name === groupName);
  if (!group) {
    return groups;
  }

  const roleIndex = group.roles.findIndex((role) => role.roleName === roleName);
  if (roleIndex < group.roles.length - 1 && roleIndex >= 0) {
    const temp = group.roles[roleIndex + 1];
    group.roles[roleIndex + 1] = group.roles[roleIndex];
    group.roles[roleIndex] = temp;
  }
  return groups;
};
