import { useEffect, useState } from "react";

import {
    getUsers,
    getRoles,
    createUser,
    updateUser,
    toggleUserStatus,
    resetPassword
} from "../../api/userApi";



const Users = () => {

    const [users, setUsers] = useState([]);

    const [roles, setRoles] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);

    const [editingUser, setEditingUser] = useState(null);

    const [form, setForm] = useState({

        username: "",

        email: "",

        password: "",

        role_id: ""

    });


    useEffect(() => {

    loadData();

}, []);


const loadData = async () => {

    try{

        const userData = await getUsers();

        const roleData = await getRoles();

        setUsers(userData);

        setRoles(roleData);

    }finally{

        setLoading(false);

    }

};

const openCreate = () => {

    setEditingUser(null);

    setForm({

        username: "",

        email: "",

        password: "",

        role_id: ""

    });

    setShowModal(true);

};


const openEdit = (user) => {

    setEditingUser(user);

    setForm({

        username: user.username,

        email: user.email,

        password: "",

        role_id: user.role_id

    });

    setShowModal(true);

};


const handleChange = (e) => {

    setForm({

        ...form,

        [e.target.name]: e.target.value

    });

};


const handleSubmit = async () => {

    if(editingUser){

        await updateUser(

            editingUser.id,

            {

                username: form.username,

                email: form.email,

                role_id: form.role_id

            }

        );

    }else{

        await createUser(form);

    }

    setShowModal(false);

    loadData();

};


const handleToggle = async (id) => {

    await toggleUserStatus(id);

    loadData();

};


const handleResetPassword = async (id) => {

    const password = prompt("Enter new password");

    if(!password) return;

    await resetPassword(id, password);

    alert("Password updated.");

};


  return (
    <div className="space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between">

            <div>

                <h1 className="text-2xl font-bold text-slate-800">
                    User Management
                </h1>

                <p className="text-slate-500">
                    Create and manage system users.
                </p>

            </div>

            <button
                onClick={openCreate}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                + Add User
            </button>

        </div>

        {/* Table */}

        <div className="bg-white rounded-xl shadow overflow-hidden">

            <table className="w-full">

                <thead className="bg-slate-100">

                    <tr>

                        <th className="text-left px-5 py-3">
                            Username
                        </th>

                        <th className="text-left px-5 py-3">
                            Email
                        </th>

                        <th className="text-left px-5 py-3">
                            Role
                        </th>

                        <th className="text-left px-5 py-3">
                            Status
                        </th>

                        <th className="text-right px-5 py-3">
                            Actions
                        </th>

                    </tr>

                </thead>

                <tbody>

                    {

                        users.map(user => (

                            <tr
                                key={user.id}
                                className="border-t"
                            >

                                <td className="px-5 py-4">

                                    {user.username}

                                </td>

                                <td className="px-5 py-4">

                                    {user.email}

                                </td>

                                <td className="px-5 py-4">

                                    {user.role}

                                </td>

                                <td className="px-5 py-4">

                                    {

                                        user.is_active ?

                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">

                                            Active

                                        </span>

                                        :

                                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm">

                                            Disabled

                                        </span>

                                    }

                                </td>

                                <td className="px-5 py-4">

                                    <div className="flex justify-end gap-2">

                                        <button

                                            onClick={() => openEdit(user)}

                                            className="px-3 py-1 rounded bg-blue-600 text-white text-sm"

                                        >

                                            Edit

                                        </button>

                                        <button

                                            onClick={() => handleResetPassword(user.id)}

                                            className="px-3 py-1 rounded bg-yellow-500 text-white text-sm"

                                        >

                                            Reset Password

                                        </button>

                                        <button

                                            onClick={() => handleToggle(user.id)}

                                            className={`

                                                px-3

                                                py-1

                                                rounded

                                                text-white

                                                text-sm

                                                ${

                                                    user.is_active

                                                    ?

                                                    "bg-red-600"

                                                    :

                                                    "bg-green-600"

                                                }

                                            `}

                                        >

                                            {

                                                user.is_active

                                                ?

                                                "Disable"

                                                :

                                                "Enable"

                                            }

                                        </button>

                                    </div>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>


        {/* Modal */}

        {

            showModal && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                    <div className="bg-white rounded-xl w-full max-w-lg p-6">

                        <h2 className="text-xl font-semibold mb-6">

                            {

                                editingUser

                                ?

                                "Edit User"

                                :

                                "Create User"

                            }

                        </h2>

                        <div className="space-y-4">

                            <input

                                name="username"

                                value={form.username}

                                onChange={handleChange}

                                placeholder="Username"

                                className="w-full border rounded-lg px-4 py-2"

                            />

                            <input

                                name="email"

                                value={form.email}

                                onChange={handleChange}

                                placeholder="Email"

                                className="w-full border rounded-lg px-4 py-2"

                            />

                            {

                                !editingUser && (

                                    <input

                                        type="password"

                                        name="password"

                                        value={form.password}

                                        onChange={handleChange}

                                        placeholder="Password"

                                        className="w-full border rounded-lg px-4 py-2"

                                    />

                                )

                            }

                            <select

                                name="role_id"

                                value={form.role_id}

                                onChange={handleChange}

                                className="w-full border rounded-lg px-4 py-2"

                            >

                                <option value="">

                                    Select Role

                                </option>

                                {

                                    roles.map(role => (

                                        <option

                                            key={role.id}

                                            value={role.id}

                                        >

                                            {role.name}

                                        </option>

                                    ))

                                }

                            </select>

                        </div>

                        <div className="flex justify-end gap-3 mt-6">

                            <button

                                onClick={() => setShowModal(false)}

                                className="px-4 py-2 rounded border"

                            >

                                Cancel

                            </button>

                            <button

                                onClick={handleSubmit}

                                className="px-5 py-2 bg-blue-600 text-white rounded-lg"

                            >

                                Save

                            </button>

                        </div>

                    </div>

                </div>

            )

        }

    </div>
);
}

export default Users