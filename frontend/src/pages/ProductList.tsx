import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Image,
  Pagination,
  Badge,
  Spin,
  message,
} from 'antd';
import { SearchOutlined, ShoppingCartOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const { Search } = Input;
const { Option } = Select;

const categories = [
  { value: '', label: '全部品类' },
  { value: '蔬菜', label: '蔬菜' },
  { value: '水果', label: '水果' },
  { value: '肉类', label: '肉类' },
  { value: '水产', label: '水产' },
  { value: '粮油', label: '粮油' },
  { value: '干货', label: '干货' },
];

const ProductList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');

  useEffect(() => {
    loadProducts();
  }, [page, category, search, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getProducts({
        page,
        limit: pageSize,
        category,
        search,
        sort: sortBy,
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      message.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const inspectionStatusMap: Record<string, { color: string; text: string }> = {
    passed: { color: 'green', text: '检测合格' },
    pending: { color: 'gold', text: '待检测' },
    failed: { color: 'red', text: '检测不合格' },
  };

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Search
              placeholder="搜索商品名称或描述"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
            />
          </Col>
          <Col span={5}>
            <Select
              placeholder="选择品类"
              style={{ width: '100%' }}
              size="large"
              value={category}
              onChange={(value) => {
                setCategory(value);
                setPage(1);
              }}
            >
              {categories.map(cat => (
                <Option key={cat.value} value={cat.value}>{cat.label}</Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <Select
              placeholder="排序方式"
              style={{ width: '100%' }}
              size="large"
              value={sortBy}
              onChange={setSortBy}
            >
              <Option value="-createdAt">最新上架</Option>
              <Option value="price">价格从低到高</Option>
              <Option value="-price">价格从高到低</Option>
              <Option value="-stock">库存充足</Option>
            </Select>
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            {user?.role === 'wholesaler' && (
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={() => navigate('/create-order')}
              >
                发布求购
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {products.map((product: any) => (
            <Col span={6} key={product._id}>
              <Badge.Ribbon
                text={inspectionStatusMap[product.inspectionStatus]?.text}
                color={inspectionStatusMap[product.inspectionStatus]?.color}
              >
                <Card
                  hoverable
                  onClick={() => navigate(`/products/${product._id}`)}
                  cover={
                    <div style={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f5f5f5',
                      fontSize: 48,
                    }}>
                      🥬
                    </div>
                  }
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 'bold' }}>{product.name}</span>
                        <Tag color="blue">{product.category}</Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ color: '#fa8c16', fontSize: 20, fontWeight: 'bold', margin: '8px 0' }}>
                          ¥{product.price}
                          <span style={{ fontSize: 12, color: '#999', marginLeft: 4 }}>/{product.unit}</span>
                        </div>
                        <div style={{ color: '#666', fontSize: 12, marginBottom: 8 }}>
                          产地：{product.origin} | 库存：{product.stock}{product.unit}
                        </div>
                        <div style={{ color: '#999', fontSize: 12 }}>
                          商户：{product.merchantId?.companyName || product.merchantId?.username}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Badge.Ribbon>
            </Col>
          ))}
        </Row>

        {products.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </Spin>
    </div>
  );
};

export default ProductList;
