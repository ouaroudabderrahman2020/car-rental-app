/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Reservations from './pages/Reservations';
import Archive from './pages/Archive';
import Fleet from './pages/Fleet';
import Financials from './pages/Financials';
import Tools from './pages/Tools';

export default function App() {
  return (
    /* HashRouter is essential for GitHub Pages to prevent 404 errors on refresh */
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Reservations />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/tools" element={<Tools />} />
        </Routes>
      </Layout>
    </Router>
  );
}