import { Outlet } from 'react-router-dom';

export function Shell() {
    return (
        <div className="Shell">
            shell works
            <Outlet />
        </div>
    );
}
