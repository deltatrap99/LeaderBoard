export interface Ambassador {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  region?: string;
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  topRankers: Ambassador[]; // Top 1, 2, 3
  otherRankers: Ambassador[]; // Rest of the list
}

export interface LeaderboardData {
  month: CategoryResult[];
  quarter: CategoryResult[];
  challenge: CategoryResult[];
  semester: CategoryResult[];
}

const mockAvatars = [
  "https://i.pravatar.cc/150?img=11",
  "https://i.pravatar.cc/150?img=12",
  "https://i.pravatar.cc/150?img=33",
  "https://i.pravatar.cc/150?img=47",
  "https://i.pravatar.cc/150?img=5",
];

export const GE_LEADERBOARD_DATA: LeaderboardData = {
  month: [
    {
      categoryId: "thang_moi",
      categoryName: "Giải thưởng Đại sứ mới",
      topRankers: [
        { id: "u1", name: "Nguyễn Văn A", score: 1250, avatar: mockAvatars[0], region: "Hà Nội" },
        { id: "u2", name: "Trần Thị B", score: 1100, avatar: mockAvatars[1], region: "Đà Nẵng" },
        { id: "u3", name: "Lê Văn C", score: 950, avatar: mockAvatars[2], region: "TP.HCM" },
      ],
      otherRankers: [
        { id: "u4", name: "Phạm D", score: 800, region: "Hải Phòng" },
        { id: "u5", name: "Hoàng E", score: 750, region: "Cần Thơ" },
      ]
    },
    {
      categoryId: "thang_top3",
      categoryName: "Top 3 Đại sứ Giáo dục xuất sắc",
      topRankers: [
        { id: "u6", name: "Đào F", score: 5400, avatar: mockAvatars[3], region: "Hà Nội" },
        { id: "u7", name: "Vũ G", score: 4800, avatar: mockAvatars[4], region: "TP.HCM" },
        { id: "u8", name: "Ngô H", score: 4200, avatar: mockAvatars[0], region: "Đà Nẵng" },
      ],
      otherRankers: []
    },
    {
      categoryId: "thang_ql_td",
      categoryName: "Quản lý tuyển dụng xuất sắc",
      topRankers: [
        { id: "u9", name: "Bùi I", score: 15, avatar: mockAvatars[1], region: "TP.HCM" },
        { id: "u10", name: "Đặng K", score: 12, avatar: mockAvatars[2], region: "Hà Nội" },
      ],
      otherRankers: [
        { id: "u11", name: "Lý L", score: 8, region: "Nghệ An" }
      ]
    },
    {
      categoryId: "thang_ql_tb",
      categoryName: "Quản lý tiêu biểu",
      topRankers: [
        { id: "u12", name: "Hồ M", score: 95, avatar: mockAvatars[3], region: "Đà Nẵng" },
      ],
      otherRankers: []
    }
  ],
  quarter: [
    {
      categoryId: "quy_top3",
      categoryName: "Top 3 ĐS Giáo dục xuất sắc Quý",
      topRankers: [
        { id: "u6", name: "Đào F", score: 15400, avatar: mockAvatars[3], region: "Hà Nội" },
        { id: "u7", name: "Vũ G", score: 14800, avatar: mockAvatars[4], region: "TP.HCM" },
        { id: "u8", name: "Ngô H", score: 14200, avatar: mockAvatars[0], region: "Đà Nẵng" },
      ],
      otherRankers: []
    },
    {
      categoryId: "quy_egc",
      categoryName: "EGC - Đại sứ Vàng",
      topRankers: [
        { id: "u13", name: "Đỗ N", score: 20000, avatar: mockAvatars[1], region: "Khánh Hòa" }
      ],
      otherRankers: []
    },
    {
      categoryId: "quy_but_toc",
      categoryName: "Đại sứ bứt tốc",
      topRankers: [
        { id: "u14", name: "Dương O", score: 350, avatar: mockAvatars[2], region: "Hà Nội" }
      ],
      otherRankers: []
    },
    {
      categoryId: "quy_ql_td",
      categoryName: "Quản lý tuyển dụng xuất sắc Quý",
      topRankers: [
        { id: "u9", name: "Bùi I", score: 45, avatar: mockAvatars[1], region: "TP.HCM" },
      ],
      otherRankers: []
    },
    {
      categoryId: "quy_ql_tb",
      categoryName: "Quản lý tiêu biểu Quý",
      topRankers: [
        { id: "u12", name: "Hồ M", score: 280, avatar: mockAvatars[3], region: "Đà Nẵng" },
      ],
      otherRankers: []
    }
  ],
  challenge: [
    {
      categoryId: "chal_moi",
      categoryName: "Challenge dành cho Đại sứ mới",
      topRankers: [
        { id: "u1", name: "Nguyễn Văn A", score: 100, avatar: mockAvatars[0], region: "Hà Nội" },
      ],
      otherRankers: []
    },
    {
      categoryId: "chal_ds",
      categoryName: "Challenge theo Doanh số",
      topRankers: [
        { id: "u6", name: "Đào F", score: 15400, avatar: mockAvatars[3], region: "Hà Nội" },
        { id: "u7", name: "Vũ G", score: 14800, avatar: mockAvatars[4], region: "TP.HCM" },
      ],
      otherRankers: []
    },
    {
      categoryId: "chal_ql",
      categoryName: "Challenge cho Đại sứ cấp quản lý",
      topRankers: [
        { id: "u12", name: "Hồ M", score: 280, avatar: mockAvatars[3], region: "Đà Nẵng" },
      ],
      otherRankers: []
    }
  ],
  semester: [
    {
      categoryId: "ky_top2",
      categoryName: "Top 2 ĐS Giáo dục xuất sắc Kỳ",
      topRankers: [
        { id: "u6", name: "Đào F", score: 35400, avatar: mockAvatars[3], region: "Hà Nội" },
        { id: "u7", name: "Vũ G", score: 32800, avatar: mockAvatars[4], region: "TP.HCM" },
      ],
      otherRankers: []
    },
    {
      categoryId: "ky_ql",
      categoryName: "Quản lý xuất sắc Kỳ",
      topRankers: [
        { id: "u12", name: "Hồ M", score: 680, avatar: mockAvatars[3], region: "Đà Nẵng" },
      ],
      otherRankers: []
    }
  ]
};
