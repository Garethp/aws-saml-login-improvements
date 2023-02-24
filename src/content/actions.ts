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
