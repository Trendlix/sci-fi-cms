const CommonBg = () => {
    return (<>
        <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-12 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div></>)
}

export default CommonBg;