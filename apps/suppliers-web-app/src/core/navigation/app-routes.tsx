import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from '../layout/shell';
import { LoginPage } from '../auth/login-page';
import { HomePage } from '../../features/home/home-page';

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Shell />}>
                    <Route path="/" element={<HomePage />} />
                </Route>
                <Route path="login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}
