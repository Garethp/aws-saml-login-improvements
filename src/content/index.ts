type Role = {
  name: string;
  accountName: string;
  roleName: string;
};

type Group = {
  name: string;
  collapsed?: boolean;
  roles: Role[];
};

const defaultGroups: Group[] = [];

let userGroups: Group[] = [];
let inEditMode: boolean = true;
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

    setUserGroups(userGroups.filter((group) => group.name !== groupName)).then(
      () => {
        console.log(userGroups);
        resetView();
        setupGroups();
      }
    );

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
    const target = event.target as HTMLElement;
    const collapse = target.parentElement;
    const oldGroupName = (
      collapse
        .getElementsByClassName("saml-account-name")
        .item(0) as HTMLElement
    ).innerText;

    if (!oldGroupName) return;

    const newGroupName = prompt("What should the new group name be");

    setUserGroups(
      userGroups.map((group) => {
        if (group.name !== oldGroupName) return group;
        return {
          ...group,
          name: newGroupName,
        };
      })
    ).then(() => {
      console.log(userGroups);
      resetView();
      setupGroups();
    });

    event.preventDefault();
    event.stopPropagation();
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

const createOption = (role, labelText) => {
  const groupingDiv = document.createElement("div");
  groupingDiv.classList.add("saml-role");

  const radioButton = document.createElement("input");
  radioButton.type = "radio";
  radioButton.name = "roleIndex";
  radioButton.value = role;
  radioButton.id = `custom-${role}`;
  radioButton.classList.add("saml-radio");

  const label = document.createElement("label");
  label.innerText = labelText;
  label.setAttribute("for", `custom-${role}`);
  label.classList.add("saml-role-description");

  groupingDiv.appendChild(radioButton);
  groupingDiv.appendChild(label);

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
        const name = prompt("What is the user-friendly name for this role?");

        if (!userGroups.some((group) => group.name === groupName))
          userGroups.push({ name: groupName, collapsed: false, roles: [] });

        userGroups
          .find((group) => group.name === groupName)
          .roles.push({ accountName, roleName, name });

        setUserGroups(userGroups).then(() => {
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
  editGroupButtons.innerText = "Edit Groups";
  editGroupButtons.className = "css3button";
  editGroupButtons.href = "#";
  editGroupButtons.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    inEditMode = !inEditMode;
    hideShowEditButtons();
  });

  const resetGroups = document.createElement("a");
  resetGroups.innerText = "Reset Groups";
  resetGroups.className = "css3button";
  resetGroups.href = "#";
  resetGroups.addEventListener("click", async () => {
    await setUserGroups(defaultGroups);
    resetView();
    setupGroups();
  });

  const resetViewButton = document.createElement("a");
  resetViewButton.innerText = "Reset";
  resetViewButton.className = "css3button";
  resetViewButton.href = "#";
  resetViewButton.addEventListener("click", () => {
    resetView();
  });

  const constructView = document.createElement("a");
  constructView.innerText = "Create";
  constructView.className = "css3button";
  constructView.href = "#";
  constructView.addEventListener("click", () => {
    setupGroups();
  });

  document.getElementById("input_signin_button").prepend(constructView);
  document.getElementById("input_signin_button").prepend(resetViewButton);
  document.getElementById("input_signin_button").prepend(resetGroups);
  document.getElementById("input_signin_button").prepend(editGroupButtons);

  hideShowEditButtons();
})();
