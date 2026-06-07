import { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  InputNumber,
  Modal,
  Form,
  message,
  Space,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  WarningOutlined,
  EditOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { inventoryAPI, productAPI } from '../services/api';

const Inventory = () => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, alertsRes] = await Promise.all([
        inventoryAPI.getInventory(),
        inventoryAPI.getAlerts(),
      ]);
      setInventory(inventoryRes.data || []);
      setAlerts(alertsRes.data);
    } catch (error) {
      message.error('加载库存数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.setFieldsValue({
      quantity: item.quantity,
      minStock: item.minStock,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await inventoryAPI.updateInventory(editingItem._id, values);
      message.success('库存更新成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: '商品名称',
      dataIndex: ['productId', 'name'],
      key: 'productName',
    },
    {
      title: '品类',
      dataIndex: ['productId', 'category'],
      key: 'category',
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '仓库',
      dataIndex: 'warehouse',
      key: 'warehouse',
    },
    {
      title: '当前库存',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number, record: any) => (
        <Space>
          <span style={{ color: val <= record.minStock ? '#ff4d4f' : '#52c41a', fontWeight: 'bold' }}>
            {val}
          </span>
          {val <= record.minStock && <WarningOutlined style={{ color: '#ff4d4f' }} />}
        </Space>
      ),
    },
    {
      title: '安全库存',
      dataIndex: 'minStock',
      key: 'minStock',
    },
    {
      title: '过期日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => (
        <Space>
          {record.lowStockAlert && <Tag color="red">库存不足</Tag>}
          {record.expiryAlert && <Tag color="orange">即将过期</Tag>}
          {!record.lowStockAlert && !record.expiryAlert && <Tag color="green">正常</Tag>}
        </Space>
      ),
    },
    {
      title: '最后补货',
      dataIndex: 'lastRestockDate',
      key: 'lastRestockDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          调整库存
        </Button>
      ),
    },
  ];

  return (
    <div>
      {alerts && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="低库存预警"
                value={alerts.lowStockCount}
                prefix={<ExclamationCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="即将过期"
                value={alerts.expiringCount}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="补货建议"
                value={alerts.restockSuggestions?.length || 0}
                prefix={<PlusOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {alerts?.restockSuggestions?.length > 0 && (
        <Card
          title="智能补货建议"
          style={{ marginBottom: 16 }}
          extra={<Tag color="red">{alerts.restockSuggestions.length}项</Tag>}
        >
          {alerts.restockSuggestions.map((item: any, idx: number) => (
            <div key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Space>
                <span style={{ fontWeight: 'bold' }}>{item.product?.name}</span>
                <Tag color={item.urgency === 'high' ? 'red' : 'orange'}>
                  {item.urgency === 'high' ? '紧急' : '建议'}
                </Tag>
                <span>当前库存：{item.currentStock}</span>
                <span style={{ color: '#52c41a' }}>建议补货：{item.suggestedAmount}</span>
              </Space>
            </div>
          ))}
        </Card>
      )}

      <Card title="库存列表">
        <Table
          columns={columns}
          dataSource={inventory}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="调整库存"
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="quantity"
            label="当前库存"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="minStock"
            label="安全库存阈值"
            rules={[{ required: true, message: '请输入安全库存' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inventory;
