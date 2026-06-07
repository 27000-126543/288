import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  Tag,
  Button,
  List,
  message,
  Space,
  Modal,
  Form,
  InputNumber,
} from 'antd';
import {
  CreditCardOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  WarningOutlined,
  PayCircleOutlined,
} from '@ant-design/icons';
import { userAPI } from '../services/api';

const CreditCenter = () => {
  const [creditInfo, setCreditInfo] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creditRes, remindersRes] = await Promise.all([
        userAPI.getCreditInfo(),
        userAPI.getPaymentReminders(),
      ]);
      setCreditInfo(creditRes.data);
      setReminders(remindersRes.data || []);
    } catch (error) {
      message.error('加载信用信息失败');
    }
  };

  const handlePayment = async () => {
    try {
      const values = await form.validateFields();
      await userAPI.makePayment({
        orderId: selectedReminder?.id,
        amount: values.amount,
      });
      message.success('还款成功');
      setPayModalVisible(false);
      loadData();
    } catch (error) {
      message.error('还款失败');
    }
  };

  const openPayModal = (reminder: any) => {
    setSelectedReminder(reminder);
    form.setFieldsValue({ amount: reminder.amount });
    setPayModalVisible(true);
  };

  const creditLevel = creditInfo ? Math.min(Math.floor(creditInfo.creditScore / 20), 5) : 0;

  const reminderColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    {
      title: '应还金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{val?.toFixed(2)}</span>,
    },
    {
      title: '到期日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '剩余天数',
      dataIndex: 'daysLeft',
      key: 'daysLeft',
      render: (days: number) => (
        <Tag color={days <= 0 ? 'red' : days <= 3 ? 'orange' : 'green'}>
          {days > 0 ? `${days}天` : `已逾期${Math.abs(days)}天`}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'overdue' ? 'red' : 'gold'}>
          {status === 'overdue' ? '已逾期' : '待还款'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="primary" size="small" icon={<PayCircleOutlined />} onClick={() => openPayModal(record)}>
          立即还款
        </Button>
      ),
    },
  ];

  return (
    <div>
      {creditInfo && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="信用评分"
                value={creditInfo.creditScore}
                suffix="/100"
                prefix={<SafetyCertificateOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 32 }}
              />
              <Progress percent={creditInfo.creditScore} status={creditLevel >= 4 ? 'success' : 'active'} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="授信额度"
                value={creditInfo.creditLimit}
                prefix="¥"
                prefixCls="credit-card"
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                可用额度：¥{creditInfo.availableCredit?.toLocaleString()}
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="会员等级"
                value={creditInfo.memberLevel === 'normal' ? '普通' : creditInfo.memberLevel === 'silver' ? '银卡' : creditInfo.memberLevel === 'gold' ? '金卡' : '钻石'}
                valueStyle={{ color: '#faad14' }}
                prefix={<RiseOutlined />}
              />
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                等级越高，授信额度越大
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="年度交易额"
                value={creditInfo.annualTransaction}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#722ed1' }}
              />
              <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                交易额影响信用评级
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title="还款提醒"
        style={{ marginBottom: 16 }}
        extra={
          <Tag color="red" icon={<WarningOutlined />}>
            {reminders.filter(r => r.status === 'overdue').length} 笔逾期
          </Tag>
        }
      >
        <Table
          columns={reminderColumns}
          dataSource={reminders}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Card title="授信规则说明">
        <Row gutter={16}>
          <Col span={12}>
            <h4>额度计算规则</h4>
            <List>
              <List.Item>基础额度：¥10,000</List.Item>
              <List.Item>银卡会员：额度 × 2</List.Item>
              <List.Item>金卡会员：额度 × 3</List.Item>
              <List.Item>钻石会员：额度 × 5</List.Item>
              <List.Item>信用分每增加10分，额度增加10%</List.Item>
            </List>
          </Col>
          <Col span={12}>
            <h4>还款规则</h4>
            <List>
              <List.Item>普通会员：账期15天</List.Item>
              <List.Item>银卡会员：账期30天</List.Item>
              <List.Item>金卡会员：账期45天</List.Item>
              <List.Item>钻石会员：账期60天</List.Item>
              <List.Item>逾期还款将扣除信用分</List.Item>
            </List>
          </Col>
        </Row>
      </Card>

      <Modal
        title="立即还款"
        open={payModalVisible}
        onOk={handlePayment}
        onCancel={() => setPayModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <p>订单号：{selectedReminder?.orderNo}</p>
          <p>应还金额：<span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥{selectedReminder?.amount?.toFixed(2)}</span></p>
          <Form.Item
            name="amount"
            label="还款金额"
            rules={[{ required: true, message: '请输入还款金额' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreditCenter;
