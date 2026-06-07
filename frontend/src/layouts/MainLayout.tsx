import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  RiseOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  CreditCardOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品市场',
    },
    {
      key: '/purchase-requests',
      icon: <BulbOutlined />,
      label: '求购信息',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: '订单管理',
    },
    user?.role === 'merchant' && {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: '库存管理',
    },
    user?.role === 'merchant' && {
      key: '/inspection',
      icon: <SafetyCertificateOutlined />,
      label: '食品安全',
    },
    {
      key: '/member',
      icon: <UserOutlined />,
      label: '会员中心',
    },
    {
      key: '/credit',
      icon: <CreditCardOutlined />,
      label: '信用结算',
    },
    {
      key: '/price-forecast',
      icon: <RiseOutlined />,
      label: '价格预测',
    },
    user?.role === 'admin' && {
      key: '/admin',
      icon: <BarChartOutlined />,
      label: '管理看板',
    },
    user?.role === 'admin' && {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: '数据报表',
    },
  ].filter(Boolean);

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <SettingOutlined />,
        label: '个人设置',
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        danger: true,
      },
    ] as any,
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
        logout();
        navigate('/login');
      }
    },
  };

  const roleNames: Record<string, string> = {
    wholesaler: '批发商',
    merchant: '商户',
    admin: '管理员',
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light">
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: collapsed ? 14 : 18,
          color: '#52c41a',
          borderBottom: '1px solid #f0f0f0',
        }}>
          {collapsed ? '农贸' : '智慧农贸管理'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems as any}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Dropdown menu={userMenu}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
              <span style={{ marginRight: 8 }}>
                {user?.username}
                <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>
                  ({roleNames[user?.role || '']})
                </span>
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 0, padding: 24, minHeight: 280, background: '#f5f5f5' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
