=� T8T� �� �8 \� �Y
=� \� �
* �: �� T8T� �8 (Bitget + Upbit @X���)
* �x: �l L� � (� 0� #000000, 9X #1a1a1a, �x� #3ECF8E)
* 0  ��: Vite + React + Tailwind + WebSocket
* ��: �| � , CoinMarketCap  X UI/UX
  �Y
1. ��X
* �� |t�� �� ( � 0| 0 L)
* ��X� T� < , \T� ��
* t`�� �4, �� �D � ��X � 
2. �� ĉ
* ��\ ��@ �@ �\ �0
* \ �� \  �� 
*  �� D� � git commit D
3. 8 t�
* �� � � � d1 <  (� T� �  L)
* ��)�  � �� �x t�
* �\ t�E �  (��\ (4 ��)
4. T� ��
* X��� .env |�
* �� constants |�
* X�T)   � (� <\ �� t  ��)
L � �m
1. ��\ ��T
    * �D�\ ErrorBoundary, Logger, API Wrapper �
    * YAGNI (You Aren't Gonna Need It) �Y  
2. 8 n��0
    * 0t 8| � T�\ n� � �
    * 8 � 8 0 �
3. 1	\ \T
    * �� Ux  \T �� �
    * ��\ �x (4 ą �
4. ��� 
    * �� |/0� \ ��  �
    * � 1 �� \� �\� ��
� X� $ �X�m
�� �t| ` �i:
1. Desktop �� node_modules �1 �
2. vite � $X � �
3. git history �� � �
4. package-lock.json �� �
5. "package.json already exists" $X �
 Q )�:

bash
# 8 � � �� �
git status  # � �� Ux
git reset --hard HEAD  # ��� �<\ d1
rm -rf node_modules package-lock.json  # t��
npm install  # �\ $X
=� \� lp

coin_project/
   src/
      components/Common/    # ��� ���
      pages/               # �t� ���
      hooks/               # �@ �
      contexts/            # � ��
      services/            # API 8�
      utils/               #  ���
   server/                  # Proxy �
   .env                     # X��
= Git �l\�

bash
# �� ܑ 
git pull
git status

# �� �� �
git add .
git commit -m "feat: [0��]"  # � fix:, refactor:

# 8 � �
git log --oneline  # ���� Ux
git reset --hard [commit-hash]  # � �<\ d1
=� t\� T� �� 
1. \� ܑ �
    * t � |D <  }��|� ��
    * 30��   t� h� �
2.  �� ܑ �
    * � �� �8 ��
    * t �� D� �� Ux
3. 8 � �
    * � �� T�� �
    * � | lp $�
    * git status �� � 