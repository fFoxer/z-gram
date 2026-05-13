--
-- PostgreSQL database dump
--

\restrict cvW450opy8u2usMQeVUSu1zMlFhVZnWhSPsnB1NmOTiqZ0tsOiVxAXcXzjiIRaQ

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_participants; Type: TABLE; Schema: public; Owner: zgram_user
--

CREATE TABLE public.chat_participants (
    chat_id integer NOT NULL,
    user_id integer NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    unread_count integer DEFAULT 0,
    CONSTRAINT chat_participants_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.chat_participants OWNER TO zgram_user;

--
-- Name: chats; Type: TABLE; Schema: public; Owner: zgram_user
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    name character varying(100),
    avatar_url text,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chats_type_check CHECK (((type)::text = ANY ((ARRAY['private'::character varying, 'group'::character varying, 'channel'::character varying])::text[])))
);


ALTER TABLE public.chats OWNER TO zgram_user;

--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: zgram_user
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chats_id_seq OWNER TO zgram_user;

--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zgram_user
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: zgram_user
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    chat_id integer,
    sender_id integer,
    content text NOT NULL,
    message_type character varying(20) DEFAULT 'text'::character varying,
    reply_to integer,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    file_url text,
    type character varying(20) DEFAULT 'text'::character varying,
    duration character varying(10),
    CONSTRAINT messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['text'::character varying, 'image'::character varying, 'file'::character varying, 'voice'::character varying])::text[])))
);


ALTER TABLE public.messages OWNER TO zgram_user;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: zgram_user
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messages_id_seq OWNER TO zgram_user;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zgram_user
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: zgram_user
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer,
    refresh_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sessions OWNER TO zgram_user;

--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: zgram_user
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sessions_id_seq OWNER TO zgram_user;

--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zgram_user
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: zgram_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    phone character varying(20) NOT NULL,
    password_hash character varying(255) NOT NULL,
    avatar_url text,
    status character varying(100) DEFAULT 'Hey there! I am using Z-Gram'::character varying,
    is_online boolean DEFAULT false,
    last_seen timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country_code character varying(5) DEFAULT '+7'::character varying,
    full_name character varying(100),
    display_name character varying(100)
);


ALTER TABLE public.users OWNER TO zgram_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: zgram_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO zgram_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zgram_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: chat_participants; Type: TABLE DATA; Schema: public; Owner: zgram_user
--

COPY public.chat_participants (chat_id, user_id, role, joined_at, unread_count) FROM stdin;
7	9	member	2026-05-06 20:09:57.268585	0
7	8	member	2026-05-06 20:09:57.268585	0
8	10	member	2026-05-06 21:46:53.394596	0
8	8	member	2026-05-06 21:46:53.394596	0
9	8	member	2026-05-12 21:34:15.682105	0
9	9	member	2026-05-12 21:34:15.682105	0
9	10	member	2026-05-12 21:34:15.682105	0
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: zgram_user
--

COPY public.chats (id, type, name, avatar_url, created_by, created_at) FROM stdin;
7	private	private_chat	\N	9	2026-05-06 20:09:57.264466
8	private	private_chat	\N	10	2026-05-06 21:46:53.390769
9	group	жопа	\N	8	2026-05-12 21:34:15.677437
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: zgram_user
--

COPY public.messages (id, chat_id, sender_id, content, message_type, reply_to, is_deleted, created_at, updated_at, is_read, read_at, is_edited, edited_at, file_url, type, duration) FROM stdin;
96	7	8	Документооборот12.jpg	text	\N	f	2026-05-12 20:45:36.385376	2026-05-12 20:45:36.385376	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618736373-ÐÐ¾ÐºÑÐ¼ÐµÐ½ÑÐ¾Ð¾Ð±Ð¾ÑÐ¾Ñ12.jpg	image	\N
98	7	8	Темы рефератов по дисциплине.docx	text	\N	f	2026-05-12 20:46:19.152285	2026-05-12 20:46:19.152285	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618779139-Ð¢ÐµÐ¼Ñ ÑÐµÑÐµÑÐ°ÑÐ¾Ð² Ð¿Ð¾ Ð´Ð¸ÑÑÐ¸Ð¿Ð»Ð¸Ð½Ðµ.docx	file	\N
100	7	8	Untitled.zip	text	\N	f	2026-05-12 20:47:05.263599	2026-05-12 20:47:05.263599	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618825251-Untitled.zip	file	\N
104	7	8	9c3224d4bfdf309121b59cfa9dd25a03.jpg	text	\N	f	2026-05-12 20:48:58.67529	2026-05-12 20:48:58.67529	t	2026-05-12 20:49:44.944606	f	\N	http://localhost:5000/uploads/1778618938663-9c3224d4bfdf309121b59cfa9dd25a03.jpg	image	\N
102	7	9	OpenTabletDriver-0.6.7_win-x64.zip	text	\N	f	2026-05-12 20:48:15.212786	2026-05-12 20:48:15.212786	t	2026-05-12 20:50:17.292905	f	\N	http://localhost:5000/uploads/1778618895128-OpenTabletDriver-0.6.7_win-x64.zip	file	\N
106	7	8	https://ru.pinterest.com/pin/1144618061541418589/	text	\N	f	2026-05-12 20:55:34.817883	2026-05-12 20:55:34.817883	t	2026-05-12 21:00:05.293144	f	\N	\N	text	\N
108	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:06:14.600862	2026-05-12 21:06:14.600862	t	2026-05-12 21:07:00.279201	f	\N	http://localhost:5000/uploads/1778619974585-voice_1778619974581.webm	voice	\N
111	7	8	doc_2025-10-01_14-38-15.mp4	text	\N	f	2026-05-12 21:08:08.915721	2026-05-12 21:08:08.915721	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620088892-doc_2025-10-01_14-38-15.mp4	file	\N
113	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:15:35.488874	2026-05-12 21:15:35.488874	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620535469-voice_1778620535463.webm	voice	0:00
115	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:21:19.494514	2026-05-12 21:21:19.494514	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620879487-voice_1778620879477.webm	voice	0:00
117	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:23:19.659784	2026-05-12 21:23:19.659784	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620999652-voice_1778620999649.webm	voice	0:04
121	7	8	fsdfsdfsdsdf	text	\N	f	2026-05-12 21:55:10.593466	2026-05-12 21:55:10.593466	t	2026-05-12 21:56:14.58909	f	\N	\N	text	\N
123	7	9	123123123123	text	\N	f	2026-05-12 21:57:28.284509	2026-05-12 21:57:28.284509	f	\N	f	\N	\N	text	\N
69	8	8	sfsdfsdf	text	\N	f	2026-05-12 20:17:25.780005	2026-05-12 20:17:25.780005	f	\N	f	\N	\N	text	\N
70	8	8	sfd	text	\N	f	2026-05-12 20:17:25.951307	2026-05-12 20:17:25.951307	f	\N	f	\N	\N	text	\N
71	8	8	fds	text	\N	f	2026-05-12 20:17:26.129285	2026-05-12 20:17:26.129285	f	\N	f	\N	\N	text	\N
72	8	8	ds	text	\N	f	2026-05-12 20:17:26.281647	2026-05-12 20:17:26.281647	f	\N	f	\N	\N	text	\N
73	8	8	sfd	text	\N	f	2026-05-12 20:17:26.438423	2026-05-12 20:17:26.438423	f	\N	f	\N	\N	text	\N
74	8	8	sd	text	\N	f	2026-05-12 20:17:26.559995	2026-05-12 20:17:26.559995	f	\N	f	\N	\N	text	\N
75	8	8	s	text	\N	f	2026-05-12 20:17:26.702565	2026-05-12 20:17:26.702565	f	\N	f	\N	\N	text	\N
76	8	8	fs	text	\N	f	2026-05-12 20:17:26.968805	2026-05-12 20:17:26.968805	f	\N	f	\N	\N	text	\N
77	8	8	ds	text	\N	f	2026-05-12 20:17:27.11368	2026-05-12 20:17:27.11368	f	\N	f	\N	\N	text	\N
78	8	8	s	text	\N	f	2026-05-12 20:17:27.266597	2026-05-12 20:17:27.266597	f	\N	f	\N	\N	text	\N
79	8	8	s	text	\N	f	2026-05-12 20:17:27.402445	2026-05-12 20:17:27.402445	f	\N	f	\N	\N	text	\N
80	8	8	fs	text	\N	f	2026-05-12 20:17:27.566827	2026-05-12 20:17:27.566827	f	\N	f	\N	\N	text	\N
81	8	8	s	text	\N	f	2026-05-12 20:17:27.767847	2026-05-12 20:17:27.767847	f	\N	f	\N	\N	text	\N
15	7	9	Привет	text	\N	f	2026-05-06 20:10:00.625942	2026-05-06 20:10:00.625942	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
18	7	9	аываываываыавв	text	\N	f	2026-05-06 20:19:38.816099	2026-05-06 20:19:38.816099	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
21	7	9	1234	text	\N	f	2026-05-06 20:27:17.615167	2026-05-06 20:27:17.615167	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
51	7	9	adsaasdasdadsasdasd	text	\N	f	2026-05-06 20:40:40.822086	2026-05-06 20:40:40.822086	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
55	7	9	adasdasda	text	\N	f	2026-05-12 20:06:27.648318	2026-05-12 20:06:27.648318	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
56	7	9	123123123	text	\N	f	2026-05-12 20:07:05.775602	2026-05-12 20:07:05.775602	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
59	7	9	31	text	\N	f	2026-05-12 20:07:29.236828	2026-05-12 20:07:29.236828	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
60	7	9	231232112321321312	text	\N	f	2026-05-12 20:07:30.866645	2026-05-12 20:07:30.866645	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
61	7	9	123123123213123123123123123123	text	\N	f	2026-05-12 20:07:56.725961	2026-05-12 20:07:56.725961	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
64	7	9	123123213213123	text	\N	f	2026-05-12 20:16:39.048642	2026-05-12 20:16:39.048642	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
65	7	9	321133123123123123123132	text	\N	f	2026-05-12 20:16:42.899669	2026-05-12 20:16:42.899669	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
68	7	9	sfdsfsdfsd	text	\N	f	2026-05-12 20:17:18.588213	2026-05-12 20:17:18.588213	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
16	7	8	Ау	text	\N	f	2026-05-06 20:10:17.317767	2026-05-06 20:10:17.317767	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
17	7	8	авыавыаываыываываыв	text	\N	f	2026-05-06 20:19:33.033301	2026-05-06 20:19:33.033301	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
19	7	8	31231231231231	text	\N	f	2026-05-06 20:27:04.663967	2026-05-06 20:27:04.663967	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
20	7	8	13123123123	text	\N	f	2026-05-06 20:27:08.51528	2026-05-06 20:27:08.51528	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
22	7	8	ывфывфы	text	\N	f	2026-05-06 20:28:47.44041	2026-05-06 20:28:47.44041	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
23	7	8	фвфывфыв	text	\N	f	2026-05-06 20:28:53.441395	2026-05-06 20:28:53.441395	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
24	7	8	фы	text	\N	f	2026-05-06 20:28:53.696091	2026-05-06 20:28:53.696091	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
25	7	8	вфы	text	\N	f	2026-05-06 20:28:53.863826	2026-05-06 20:28:53.863826	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
26	7	8	в	text	\N	f	2026-05-06 20:28:54.035639	2026-05-06 20:28:54.035639	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
27	7	8	вы	text	\N	f	2026-05-06 20:28:54.198731	2026-05-06 20:28:54.198731	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
28	7	8	ыфвфы	text	\N	f	2026-05-06 20:28:54.471439	2026-05-06 20:28:54.471439	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
29	7	8	в	text	\N	f	2026-05-06 20:28:54.585671	2026-05-06 20:28:54.585671	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
30	7	8	ыфв	text	\N	f	2026-05-06 20:28:54.734724	2026-05-06 20:28:54.734724	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
31	7	8	2	text	\N	f	2026-05-06 20:28:55.026566	2026-05-06 20:28:55.026566	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
32	7	8	123	text	\N	f	2026-05-06 20:28:55.399484	2026-05-06 20:28:55.399484	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
33	7	8	123	text	\N	f	2026-05-06 20:28:55.587438	2026-05-06 20:28:55.587438	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
34	7	8	12	text	\N	f	2026-05-06 20:28:55.726243	2026-05-06 20:28:55.726243	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
35	7	8	123фв	text	\N	f	2026-05-06 20:28:59.05108	2026-05-06 20:28:59.05108	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
36	7	8	фы	text	\N	f	2026-05-06 20:28:59.282895	2026-05-06 20:28:59.282895	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
37	7	8	вф	text	\N	f	2026-05-06 20:28:59.431036	2026-05-06 20:28:59.431036	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
38	7	8	ыв	text	\N	f	2026-05-06 20:28:59.584669	2026-05-06 20:28:59.584669	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
39	7	8	ыфв	text	\N	f	2026-05-06 20:28:59.737934	2026-05-06 20:28:59.737934	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
40	7	8	фы	text	\N	f	2026-05-06 20:28:59.882358	2026-05-06 20:28:59.882358	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
41	7	8	в	text	\N	f	2026-05-06 20:28:59.997173	2026-05-06 20:28:59.997173	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
52	8	10	23131	text	\N	f	2026-05-06 21:47:08.197294	2026-05-06 21:47:08.197294	t	2026-05-12 20:24:33.028716	f	\N	\N	text	\N
66	7	9	sfsdfsdfsdfsdfsdfsdfsdfsds	text	\N	f	2026-05-12 20:17:12.594013	2026-05-12 20:17:12.594013	t	2026-05-12 20:21:47.409724	f	\N	\N	text	\N
90	7	9	ладно	text	\N	f	2026-05-12 20:24:45.737531	2026-05-12 20:24:45.737531	t	2026-05-12 20:28:57.15663	f	\N	\N	text	\N
42	7	8	фыв	text	\N	f	2026-05-06 20:29:00.225281	2026-05-06 20:29:00.225281	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
43	7	8	ыф	text	\N	f	2026-05-06 20:29:00.40081	2026-05-06 20:29:00.40081	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
44	7	8	ыфв	text	\N	f	2026-05-06 20:29:00.589259	2026-05-06 20:29:00.589259	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
45	7	8	фвы	text	\N	f	2026-05-06 20:29:00.711347	2026-05-06 20:29:00.711347	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
46	7	8	фывыффвыф	text	\N	f	2026-05-06 20:31:42.296752	2026-05-06 20:31:42.296752	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
47	7	8	sfsdfsdsd	text	\N	f	2026-05-06 20:31:49.310269	2026-05-06 20:31:49.310269	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
48	7	8	sdfsdfsdf	text	\N	f	2026-05-06 20:31:51.570281	2026-05-06 20:31:51.570281	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
49	7	8	23123	text	\N	f	2026-05-06 20:35:58.637103	2026-05-06 20:35:58.637103	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
50	7	8	блядство	text	\N	f	2026-05-06 20:40:37.8728	2026-05-06 20:40:37.8728	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
53	7	8	efgdfd	text	\N	f	2026-05-12 19:13:00.601797	2026-05-12 19:13:00.601797	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
54	7	8	dasdadasdas	text	\N	f	2026-05-12 20:06:08.818456	2026-05-12 20:06:08.818456	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
57	7	8	312213123123123123321312312312312	text	\N	f	2026-05-12 20:07:24.414148	2026-05-12 20:07:24.414148	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
58	7	8	123123123123123	text	\N	f	2026-05-12 20:07:27.378616	2026-05-12 20:07:27.378616	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
62	7	8	321	text	\N	f	2026-05-12 20:08:00.615825	2026-05-12 20:08:00.615825	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
63	7	8	3131231231321\\	text	\N	f	2026-05-12 20:16:34.502222	2026-05-12 20:16:34.502222	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
67	7	8	fsdfsfsdfsdfsdfsdfsd	text	\N	f	2026-05-12 20:17:16.299837	2026-05-12 20:17:16.299837	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
82	7	8	adadasd	text	\N	f	2026-05-12 20:23:31.165527	2026-05-12 20:23:31.165527	t	2026-05-12 20:23:52.862573	f	\N	\N	text	\N
91	7	9	пихуй	text	\N	f	2026-05-12 20:24:47.134759	2026-05-12 20:24:47.134759	t	2026-05-12 20:28:57.15663	f	\N	\N	text	\N
109	7	9	Голосовое сообщение	text	\N	f	2026-05-12 21:07:09.112526	2026-05-12 21:07:09.112526	t	2026-05-12 21:14:21.044738	f	\N	http://localhost:5000/uploads/1778620029098-voice_1778620029096.webm	voice	\N
83	7	9	312312321	text	\N	f	2026-05-12 20:23:56.934738	2026-05-12 20:23:56.934738	t	2026-05-12 20:24:33.729631	f	\N	\N	text	\N
84	7	9	123123	text	\N	f	2026-05-12 20:24:25.649618	2026-05-12 20:24:25.649618	t	2026-05-12 20:24:33.729631	f	\N	\N	text	\N
85	7	9	123	text	\N	f	2026-05-12 20:24:26.139267	2026-05-12 20:24:26.139267	t	2026-05-12 20:24:33.729631	f	\N	\N	text	\N
86	7	9	123	text	\N	f	2026-05-12 20:24:26.571349	2026-05-12 20:24:26.571349	t	2026-05-12 20:24:33.729631	f	\N	\N	text	\N
87	7	9	123	text	\N	f	2026-05-12 20:24:26.756592	2026-05-12 20:24:26.756592	t	2026-05-12 20:24:33.729631	f	\N	\N	text	\N
88	7	9	12	text	\N	f	2026-05-12 20:24:26.878586	2026-05-12 20:24:26.878586	t	2026-05-12 20:24:33.729631	f	\N	\N	text	\N
94	7	8	rufus-4.14.exe	text	\N	f	2026-05-12 20:44:43.037477	2026-05-12 20:44:43.037477	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618683009-rufus-4.14.exe	file	\N
95	7	8	image_1775936680205395.png	text	\N	f	2026-05-12 20:44:51.617855	2026-05-12 20:44:51.617855	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618691609-image_1775936680205395.png	image	\N
97	7	8	img-9jrxJy.png	text	\N	f	2026-05-12 20:45:56.782878	2026-05-12 20:45:56.782878	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618756771-img-9jrxJy.png	image	\N
99	7	8	rufus-4.14.exe	text	\N	f	2026-05-12 20:46:36.685786	2026-05-12 20:46:36.685786	t	2026-05-12 20:47:32.531129	f	\N	http://localhost:5000/uploads/1778618796665-rufus-4.14.exe	file	\N
103	7	8	https://i.pinimg.com/736x/9c/32/24/9c3224d4bfdf309121b59cfa9dd25a03.jpg	text	\N	f	2026-05-12 20:48:44.272886	2026-05-12 20:48:44.272886	t	2026-05-12 20:49:44.944606	f	\N	\N	text	\N
105	7	8	9c3224d4bfdf309121b59cfa9dd25a03.jpg	text	\N	f	2026-05-12 20:49:32.334468	2026-05-12 20:49:32.334468	t	2026-05-12 20:49:44.944606	f	\N	http://localhost:5000/uploads/1778618972331-9c3224d4bfdf309121b59cfa9dd25a03.jpg	image	\N
101	7	9	1778618779139-Ð¢ÐµÐ¼Ñ_ Ñ_ÐµÑ_ÐµÑ_Ð°Ñ_Ð¾Ð² Ð¿Ð¾ Ð´Ð¸Ñ_Ñ_Ð¸Ð¿Ð»Ð¸Ð½Ðµ.docx	text	\N	f	2026-05-12 20:48:01.916626	2026-05-12 20:48:01.916626	t	2026-05-12 20:50:17.292905	f	\N	http://localhost:5000/uploads/1778618881906-1778618779139-ÃÂ¢ÃÂµÃÂ¼Ã_ Ã_ÃÂµÃ_ÃÂµÃ_ÃÂ°Ã_ÃÂ¾ÃÂ² ÃÂ¿ÃÂ¾ ÃÂ´ÃÂ¸Ã_Ã_ÃÂ¸ÃÂ¿ÃÂ»ÃÂ¸ÃÂ½ÃÂµ.docx	file	\N
107	7	8	primer-titulnogo-lista-referata-14b2f138be016f175b41d0ab22516271.doc	text	\N	f	2026-05-12 21:00:39.402377	2026-05-12 21:00:39.402377	t	2026-05-12 21:07:00.279201	f	\N	http://localhost:5000/uploads/1778619639388-primer-titulnogo-lista-referata-14b2f138be016f175b41d0ab22516271.doc	file	\N
110	7	9	Голосовое сообщение	text	\N	f	2026-05-12 21:07:17.407146	2026-05-12 21:07:17.407146	t	2026-05-12 21:14:21.044738	f	\N	http://localhost:5000/uploads/1778620037402-voice_1778620037399.webm	voice	\N
112	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:14:29.23641	2026-05-12 21:14:29.23641	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620469231-voice_1778620469225.webm	voice	0:00
114	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:17:55.146284	2026-05-12 21:17:55.146284	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620675134-voice_1778620675130.webm	voice	0:00
116	7	8	Голосовое сообщение	text	\N	f	2026-05-12 21:21:36.071274	2026-05-12 21:21:36.071274	t	2026-05-12 21:34:33.755517	f	\N	http://localhost:5000/uploads/1778620896056-voice_1778620896053.webm	voice	0:00
118	9	8	аыавыаы	text	\N	f	2026-05-12 21:34:19.555793	2026-05-12 21:34:19.555793	t	2026-05-12 21:34:34.688317	f	\N	\N	text	\N
119	9	9	иди нахуй	text	\N	f	2026-05-12 21:34:44.264878	2026-05-12 21:34:44.264878	t	2026-05-12 21:39:15.401287	f	\N	\N	text	\N
120	9	9	Голосовое сообщение	text	\N	f	2026-05-12 21:34:49.217862	2026-05-12 21:34:49.217862	t	2026-05-12 21:39:15.401287	f	\N	http://localhost:5000/uploads/1778621689213-voice_1778621689207.webm	voice	0:02
122	7	8	1312323123123123213132	text	\N	f	2026-05-12 21:56:08.096763	2026-05-12 21:56:08.096763	t	2026-05-12 21:56:14.58909	f	\N	\N	text	\N
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: zgram_user
--

COPY public.sessions (id, user_id, refresh_token, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: zgram_user
--

COPY public.users (id, username, phone, password_hash, avatar_url, status, is_online, last_seen, created_at, updated_at, country_code, full_name, display_name) FROM stdin;
10	@decaten321	+799999999999	$2b$10$sWKY6G.z9XQJeVBJzGN39uLxX7vOGEPYJ8r7QGUxiqIUtpEPuV2dW	\N	Hey there! I am using Z-Gram	f	2026-05-06 21:46:46.115153	2026-05-06 21:46:46.115153	2026-05-06 21:46:46.115153	+7	Лаукайтис	\N
8	@decaten	+79011195434	$2b$10$mwaq/Qa8M3t72WbdHG8nmOpKfyQt.UxOvAn41gpgLdR7OuM0zxumO	\N	Hey there! I am using Z-Gram	t	2026-05-12 21:57:18.121557	2026-05-06 20:09:11.033985	2026-05-06 20:09:11.033985	+7	Лаукайтис Дмитрий	\N
9	@decaten1	+79040158717	$2b$10$gPpbdOIIqxCDjQCGw0vkVu8rWg7cooxJg87Z5Yxh0q4OxFgSQpaD.	\N	Hey there! I am using Z-Gram	f	2026-05-12 21:59:38.034815	2026-05-06 20:09:49.422525	2026-05-06 20:09:49.422525	+7	Дима	\N
\.


--
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zgram_user
--

SELECT pg_catalog.setval('public.chats_id_seq', 9, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zgram_user
--

SELECT pg_catalog.setval('public.messages_id_seq', 123, true);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zgram_user
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zgram_user
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: chat_participants chat_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_pkey PRIMARY KEY (chat_id, user_id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_chat_participants_user_id; Type: INDEX; Schema: public; Owner: zgram_user
--

CREATE INDEX idx_chat_participants_user_id ON public.chat_participants USING btree (user_id);


--
-- Name: idx_messages_chat_id; Type: INDEX; Schema: public; Owner: zgram_user
--

CREATE INDEX idx_messages_chat_id ON public.messages USING btree (chat_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: zgram_user
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_edited; Type: INDEX; Schema: public; Owner: zgram_user
--

CREATE INDEX idx_messages_edited ON public.messages USING btree (chat_id) WHERE (is_edited = true);


--
-- Name: idx_messages_unread; Type: INDEX; Schema: public; Owner: zgram_user
--

CREATE INDEX idx_messages_unread ON public.messages USING btree (chat_id, is_read) WHERE (is_read = false);


--
-- Name: chat_participants chat_participants_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: chat_participants chat_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.chat_participants
    ADD CONSTRAINT chat_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chats chats_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: messages messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: messages messages_reply_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zgram_user
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict cvW450opy8u2usMQeVUSu1zMlFhVZnWhSPsnB1NmOTiqZ0tsOiVxAXcXzjiIRaQ

