import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from '@core/layout/shell';
import { LoginPage } from '@core/auth/login-page';
import { HomePage } from '@features/home/home-page';
import { EditBusinessPage } from '@features/edit-business/edit-business-page';
import { EditProductsPage } from '@features/edit-products/edit-products-page';

export function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Shell />}>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/edit-business"
                        element={<EditBusinessPage />}
                    />
                    <Route
                        path="/edit-products"
                        element={<EditProductsPage />}
                    />
                </Route>
                <Route path="login" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}
