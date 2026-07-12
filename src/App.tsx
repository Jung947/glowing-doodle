import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import ProfileSelect from './screens/ProfileSelect';
import Home from './screens/Home';
import DailyPlanScreen from './screens/DailyPlanScreen';
import AreaScreen from './screens/AreaScreen';
import ActivityPlayer from './screens/ActivityPlayer';
import RewardScreen from './screens/RewardScreen';
import ParentDashboard from './screens/parent/ParentDashboard';
import LevelSettings from './screens/parent/LevelSettings';
import PlanSettings from './screens/parent/PlanSettings';
import ProgressReport from './screens/parent/ProgressReport';

export default function App() {
  const { activeChild } = useApp();

  // Until a child is chosen, everything funnels to the profile picker.
  if (!activeChild) {
    return (
      <Routes>
        <Route path="/profiles" element={<ProfileSelect />} />
        <Route path="*" element={<Navigate to="/profiles" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/profiles" element={<ProfileSelect />} />
      <Route path="/home" element={<Home />} />
      <Route path="/plan" element={<DailyPlanScreen />} />
      <Route path="/area/:areaId" element={<AreaScreen />} />
      <Route path="/activity/:activityId" element={<ActivityPlayer />} />
      <Route path="/reward" element={<RewardScreen />} />
      <Route path="/parent" element={<ParentDashboard />} />
      <Route path="/parent/levels" element={<LevelSettings />} />
      <Route path="/parent/plan" element={<PlanSettings />} />
      <Route path="/parent/report" element={<ProgressReport />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
