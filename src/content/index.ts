import {
  addRole,
  changeGroupName,
  changeRoleName,
  removeGroup,
  removeRole,
} from "./actions";

export type Role = {
  name: string;
  accountName: string;
  roleName: string;
};

export type Group = {
  name: string;
  collapsed?: boolean;
  roles: Role[];
};

const defaultGroups: Group[] = [];
const devMode = false;

let userGroups: Group[] = [];
let inEditMode: boolean = devMode;
let form: HTMLElement;
let samlForm: HTMLElement;
let isSetUp: boolean = false;

const createDivider = () => {
  const divider = document.createElement("hr");
  divider.style.cssText = "border: 1px solid #ddd;";

  return divider;
};

const createGroup = (id, label) => {
  const group = document.createElement("div");
  group.classList.add("saml-account");

  const collapse = document.createElement("div");
  collapse.classList.add("expandable-container");
  collapse.setAttribute("data-accountindex", id);

  const collapseImage = document.createElement("img");
  collapseImage.src = "/static/image/down.png";
  collapseImage.id = `image${id}`;

  collapse.appendChild(collapseImage);

  const groupLabel = document.createElement("div");
  groupLabel.classList.add("saml-account-name");
  groupLabel.innerText = label;

  const deleteGroupButton = document.createElement("div");
  deleteGroupButton.innerText = "❌";
  deleteGroupButton.classList.add("saml-account-name");
  deleteGroupButton.classList.add("group-delete-button");
  deleteGroupButton.classList.add("edit-only-button");
  deleteGroupButton.style.paddingLeft = "5px";
  deleteGroupButton.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const collapse = target.parentElement;
    const groupName = (
      collapse
        .getElementsByClassName("saml-account-name")
        .item(0) as HTMLElement
    ).innerText;

    if (!groupName) return;

    setUserGroups(removeGroup(userGroups, groupName)).then(() => {
      resetView();
      setupGroups();
    });

    event.preventDefault();
    event.stopPropagation();
    return false;
  });

  const editGroupButton = document.createElement("div");
  editGroupButton.innerText = "✏️";
  editGroupButton.classList.add("saml-account-name");
  editGroupButton.classList.add("group-edit-button");
  editGroupButton.classList.add("edit-only-button");
  editGroupButton.style.paddingLeft = "5px";
  editGroupButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const collapse = target.parentElement;
    const oldGroupName = (
      collapse
        .getElementsByClassName("saml-account-name")
        .item(0) as HTMLElement
    ).innerText;

    if (!oldGroupName) return;

    const newGroupName = prompt("What should the new group name be");
    if (!newGroupName) return;

    if (newGroupName == "Default Groups") {
      alert(`Cannot call this group "Default Groups"`);
      return;
    }

    if (!!userGroups.find((group) => group.name === newGroupName)) {
      alert(`The group ${newGroupName} already exists`);
      return;
    }

    setUserGroups(changeGroupName(userGroups, oldGroupName, newGroupName)).then(
      () => {
        console.log(userGroups);
        resetView();
        setupGroups();
      }
    );

    return false;
  });

  const groupContent = document.createElement("div");
  groupContent.classList.add("saml-account");
  groupContent.id = id;

  collapse.appendChild(groupLabel);

  if (label != "Default Groups") {
    collapse.appendChild(editGroupButton);
    collapse.appendChild(deleteGroupButton);
  }
  group.appendChild(collapse);
  group.appendChild(createDivider());
  group.appendChild(groupContent);

  return { group, groupContent };
};

const resetView = () => {
  if (!isSetUp) return;

  Array.from(form.querySelectorAll(".edit-only-button")).forEach((element) => {
    element.remove();
  });

  Array.from(form.children).forEach((element) => {
    if (element.classList.contains("saml-account")) element.remove();
  });

  form.insertBefore(samlForm, form.querySelector("#saml_form > p").nextSibling);
  isSetUp = false;
};

const createOption = (roleArn: string, labelText: string) => {
  const groupingDiv = document.createElement("div");
  groupingDiv.classList.add("saml-role");

  const radioButton = document.createElement("input");
  radioButton.type = "radio";
  radioButton.name = "roleIndex";
  radioButton.value = roleArn;
  radioButton.id = `custom-${roleArn}`;
  radioButton.classList.add("saml-radio");

  const label = document.createElement("label");
  label.innerText = labelText;
  label.setAttribute("for", `custom-${roleArn}`);
  label.classList.add("saml-role-description");

  const infoIcon = document.createElement("div");
  infoIcon.innerText = "ℹ️";
  infoIcon.classList.add("saml-account-name");
  infoIcon.style.paddingLeft = "5px";
  infoIcon.title = roleArn;

  const deleteRoleButton = document.createElement("div");
  deleteRoleButton.innerText = "❌";
  deleteRoleButton.classList.add("saml-account-name");
  deleteRoleButton.classList.add("group-delete-button");
  deleteRoleButton.classList.add("edit-only-button");
  deleteRoleButton.style.paddingLeft = "5px";
  deleteRoleButton.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const group = target.parentElement;
    const roleName = group.getElementsByTagName("label")[0].innerText;
    const account = group.parentElement.parentElement;
    const groupName = (
      account.getElementsByClassName("saml-account-name").item(0) as HTMLElement
    ).innerText;

    setUserGroups(removeRole(userGroups, groupName, roleName)).then(() => {
      resetView();
      setupGroups();
    });

    event.preventDefault();
    event.stopPropagation();
    return false;
  });

  const editRoleButton = document.createElement("div");
  editRoleButton.innerText = "✏️";
  editRoleButton.classList.add("saml-account-name");
  editRoleButton.classList.add("group-edit-button");
  editRoleButton.classList.add("edit-only-button");
  editRoleButton.style.paddingLeft = "5px";
  editRoleButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const group = target.parentElement;
    const oldRoleName = group.getElementsByTagName("label")[0].innerText;
    const account = group.parentElement.parentElement;
    const groupName = (
      account.getElementsByClassName("saml-account-name").item(0) as HTMLElement
    ).innerText;

    const newRoleName = prompt("What should the role's name be changed to?");
    if (!newRoleName) return;

    if (
      !!userGroups
        .find((group) => group.name === groupName)
        ?.roles.find((role) => role.name === newRoleName)
    ) {
      alert(`Role by the name "${newRoleName}" already exists`);
      return;
    }

    setUserGroups(
      changeRoleName(userGroups, groupName, oldRoleName, newRoleName)
    ).then(() => {
      resetView();
      setupGroups();
    });

    return false;
  });

  groupingDiv.appendChild(radioButton);
  groupingDiv.appendChild(label);
  groupingDiv.appendChild(infoIcon);
  groupingDiv.appendChild(editRoleButton);
  groupingDiv.appendChild(deleteRoleButton);

  return groupingDiv;
};

const setUserGroups = async (groups: Group[]) => {
  userGroups = groups;
  return browser.storage.sync.set({ groupSettings: groups });
};

const setupGroups = () => {
  if (isSetUp) return;

  // Move the existing items into a "Default Group"
  const { group: defaultGroup, groupContent: defaultGroupContent } =
    createGroup("default-content", "Default Groups");

  defaultGroupContent.appendChild(samlForm);

  form.insertBefore(
    defaultGroup,
    form.querySelector("#saml_form > p").nextSibling
  );

  const roles: Record<
    string,
    { name: string; accountId: string; roles: string[] }
  > = {};

  // Loop through the existing elements and create a record of what roles we have available to us
  for (let i = 0; i < samlForm.children.length; i++) {
    const element = samlForm.children[i];

    const label = element.querySelector(".saml-account-name").textContent;
    const [_, accountName] = label.match(/^.*: (.*) \([\d]+\)$/);

    element.querySelectorAll(".saml-role-description").forEach((inputLabel) => {
      const arn = inputLabel.getAttribute("for");
      const [_, account, roleName] = arn.match(
        "arn:aws:iam::(\\d+):role/([^:]+)"
      );

      roles[account] = roles[account] ?? {
        name: accountName,
        accountId: account,
        roles: [],
      };
      roles[account].roles.push(roleName);
    });
  }

  // Loop through our user-defined groups and try to create options for roles that we have access to
  [...userGroups].reverse().forEach((customGroup) => {
    const { group, groupContent } = createGroup(
      `custom-${customGroup.name}`,
      customGroup.name
    );

    customGroup.roles.forEach((role) => {
      const account = Object.values(roles).find(
        (account) => account.name === role.accountName
      );

      if (!account) return;

      const arn = `arn:aws:iam::${account.accountId}:role/${role.roleName}`;

      groupContent.appendChild(createOption(arn, role.name));
    });

    if (groupContent.children.length == 0) return;

    form.insertBefore(group, form.querySelector("#saml_form > p").nextSibling);

    if (customGroup.collapsed === true) {
      setTimeout(() => (group.children[0] as HTMLElement).click(), 10);
    }
  });

  const helpText = document.createElement("div");
  helpText.classList.add("saml-account");
  helpText.style.fontSize = "17px";
  helpText.innerHTML = `It looks like this may be your first time using this extension. To get started, click the "Edit"
   button below and expand the "Default Groups" section. You should see ➕ buttons next to each AWS Role. Click the
   ➕ button, and you'll be prompted for a Group Name and a User-Friendly Name for that role. Keep adding groups to suit
   your display and selection of counts as you wish. <br /><br /> Don't worry, any groups that you add will still be
   available to see in the "Default Groups" view`;

  if (userGroups.length === 0) {
    form.insertBefore(
      helpText,
      form.querySelector("#saml_form > p").nextSibling
    );
  }

  // Loop through the existing elements and add the edit buttons
  Array.from(samlForm.children).forEach((element) => {
    element.querySelectorAll(".saml-role-description").forEach((inputLabel) => {
      const addButton = document.createElement("a");
      addButton.innerText = "➕";
      addButton.style.paddingLeft = "5px";
      addButton.classList.add("edit-only-button");
      addButton.addEventListener("click", (event) => {
        const labelContainer = (event.target as HTMLElement).parentElement;
        const roleName = labelContainer
          .getElementsByClassName("saml-role-description")
          .item(0).innerHTML;

        const accountContainer = labelContainer.parentElement.parentElement;
        const accountLabelContainer = accountContainer
          .getElementsByClassName("saml-account-name")
          .item(0);
        const accountLabel = accountLabelContainer.innerHTML;
        const [_, accountName] = accountLabel.match(/^.*: (.*) \([\d]+\)$/);

        const groupName = prompt("Which group should this role go into?");
        if (!groupName) return;

        if (groupName == "Default Groups") {
          alert(`Cannot name the group "Default Groups"`);
          return;
        }

        const name = prompt("What is the user-friendly name for this role?");
        if (!name) return;

        if (
          !!userGroups
            .find((group) => group.name === groupName)
            ?.roles.find((role) => role.name === name)
        ) {
          alert(`Role by the name "${name}" already exists`);
          return;
        }

        setUserGroups(
          addRole(userGroups, groupName, { accountName, roleName, name })
        ).then(() => {
          resetView();
          setupGroups();
        });
      });

      inputLabel.parentElement.insertBefore(addButton, inputLabel.nextSibling);
    });
  });

  // Quick setup for afterwards
  isSetUp = true;
  hideShowEditButtons();
  setTimeout(
    () =>
      (
        document.getElementById("default-content").parentElement
          .children[0] as HTMLElement
      ).click(),
    10
  );
};

const hideShowEditButtons = () =>
  document.querySelectorAll(".edit-only-button").forEach((element) => {
    (element as HTMLElement).style.display = inEditMode ? "initial" : "none";
  });

(async function () {
  const { groupSettings } = await browser.storage.sync.get("groupSettings");
  if (!groupSettings) {
    await setUserGroups(defaultGroups);
  }

  userGroups =
    ((await browser.storage.sync.get("groupSettings"))[
      "groupSettings"
    ] as Group[]) ?? defaultGroups;

  const divider = document.createElement("hr");
  divider.style.cssText = "border: 1px solid #ddd;";

  form = document.querySelector("#saml_form");
  samlForm = document.querySelector("#saml_form > fieldset");

  setupGroups();

  const editGroupButtons = document.createElement("a");
  editGroupButtons.innerText = "Edit";
  editGroupButtons.className = "css3button";
  editGroupButtons.href = "#";
  editGroupButtons.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    inEditMode = !inEditMode;
    hideShowEditButtons();
  });

  const clearGroups = document.createElement("a");
  clearGroups.innerText = "Clear";
  clearGroups.className = "css3button";
  clearGroups.href = "#";
  clearGroups.addEventListener("click", async () => {
    await setUserGroups(defaultGroups);
    resetView();
    setupGroups();
  });

  const defaultView = document.createElement("a");
  defaultView.innerText = "Default";
  defaultView.className = "css3button";
  defaultView.href = "#";
  defaultView.addEventListener("click", () => {
    resetView();
  });

  const setupView = document.createElement("a");
  setupView.innerText = "Setup";
  setupView.className = "css3button";
  setupView.href = "#";
  setupView.addEventListener("click", () => {
    setupGroups();
  });

  if (devMode) {
    document.getElementById("input_signin_button").prepend(setupView);
    document.getElementById("input_signin_button").prepend(defaultView);
    document.getElementById("input_signin_button").prepend(clearGroups);
  }

  document.getElementById("input_signin_button").prepend(editGroupButtons);

  hideShowEditButtons();
})();
