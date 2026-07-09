import { useEffect, useState } from "react";

import {
    getRoles,
    getRolePermissions,
    updateRolePermissions,
} from "../../api/roleApi";

import {
    getPermissions,
} from "../../api/permissionApi";

const RolesPermissions = () => {

    const [roles, setRoles] = useState([]);

    const [permissions, setPermissions] = useState([]);

    const [selectedRole, setSelectedRole] = useState(null);

    const [selectedPermissions, setSelectedPermissions] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadData();

    }, []);


    const loadData = async () => {

        try {

            const roleData = await getRoles();

            const permissionData = await getPermissions();

            setRoles(roleData);

            setPermissions(permissionData);

        }

        finally {

            setLoading(false);

        }

    };


    const selectRole = async (role) => {

    setSelectedRole(role);

    const assigned = await getRolePermissions(role.id);

    setSelectedPermissions(assigned.permissions);

};


    const togglePermission = (permissionId) => {

    setSelectedPermissions((prev) =>

        prev.includes(permissionId)
            ? prev.filter(id => id !== permissionId)
            : [...prev, permissionId]

    );

};

const handleSave = async () => {

    if (!selectedRole) return;

    await updateRolePermissions(
        selectedRole.id,
        selectedPermissions
    );

    alert("Permissions updated successfully.");

};

const groupedPermissions = permissions.reduce((groups, permission) => {

    if (!groups[permission.module]) {

        groups[permission.module] = [];

    }

    groups[permission.module].push(permission);

    return groups;

}, {});





    return (

        

<div className="grid grid-cols-12 gap-6">

    <div className="col-span-3 bg-white rounded-lg shadow">

        <h2 className="font-semibold p-4 border-b">

            Roles

        </h2>

        {

            roles.map(role => (

                <button

                    key={role.id}

                    onClick={() => selectRole(role)}

                    className={`

                        w-full

                        text-left

                        px-4

                        py-3

                        border-b

                        hover:bg-slate-100

                        ${selectedRole?.id === role.id
                            ? "bg-blue-100 font-semibold"
                            : ""}

                    `}

                >

                    {role.name}

                </button>

            ))

        }

    </div>

    <div className="col-span-9 bg-white rounded-lg shadow">

    <div className="p-6 border-b">

        <h2 className="text-xl font-semibold">

            {selectedRole
                ? `${selectedRole.name} Permissions`
                : "Select a Role"}

        </h2>

    </div>

    {

        selectedRole ? (

            <div className="p-6 space-y-8">

                {

                    Object.entries(groupedPermissions).map(

                        ([module, perms]) => (

                            <div key={module}>

                                <h3 className="text-lg font-semibold capitalize mb-3 border-b pb-2">

                                    {module}

                                </h3>

                                <div className="grid grid-cols-2 gap-3">

                                    {

                                        perms.map(permission => (

                                            <label

                                                key={permission.id}

                                                className="flex items-center gap-3"

                                            >

                                                <input

                                                    type="checkbox"

                                                    checked={selectedPermissions.includes(permission.id)}

                                                    onChange={() => togglePermission(permission.id)}

                                                    className="w-4 h-4"

                                                />

                                                <span>

                                                    {permission.name}

                                                </span>

                                            </label>

                                        ))

                                    }

                                </div>

                            </div>

                        )

                    )

                }

                <div className="pt-6 border-t">

                    <button

                        onClick={handleSave}

                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"

                    >

                        Save Changes

                    </button>

                </div>

            </div>

        ) : (

            <div className="flex items-center justify-center h-96 text-gray-500">

                Select a role from the left.

            </div>

        )

    }

</div>

</div>


    );

};

export default RolesPermissions;